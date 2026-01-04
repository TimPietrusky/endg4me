import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  TASKS,
  FOUNDER_MODIFIERS,
  XP_CURVE,
  LEVEL_REWARDS,
  CLAN_BONUS,
  MAX_LEVEL,
  getQueueSlotsForLevel,
  type TaskType,
  type TaskConfig,
} from "./lib/gameConstants";
import { RP_REWARDS } from "./lib/skillTree";
import { internal } from "./_generated/api";

// Helper to calculate random factor
function getRandomFactor(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Start a task
export const startTask = mutation({
  args: {
    labId: v.id("labs"),
    taskType: v.union(
      v.literal("train_small_model"),
      v.literal("train_medium_model"),
      v.literal("freelance_contract"),
      v.literal("hire_junior_researcher"),
      v.literal("rent_gpu_cluster")
    ),
  },
  handler: async (ctx, args) => {
    const taskConfig = TASKS[args.taskType] as TaskConfig;
    
    // Get lab and state
    const lab = await ctx.db.get(args.labId);
    if (!lab) throw new Error("Lab not found");

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();
    if (!labState) throw new Error("Lab state not found");

    // Check cost
    if (labState.cash < taskConfig.cost) {
      throw new Error("Not enough cash");
    }

    // Check compute (for training tasks)
    if (taskConfig.computeRequired > 0) {
      // Count active training tasks
      const activeTasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", args.labId).eq("status", "in_progress")
        )
        .collect();
      
      const usedCompute = activeTasks.filter(
        (t) => t.type === "train_small_model" || t.type === "train_medium_model"
      ).length;

      if (usedCompute >= labState.computeUnits) {
        throw new Error("Not enough compute units");
      }
    }

    // Check staff capacity (for hiring)
    if (args.taskType === "hire_junior_researcher") {
      const staffUsed = labState.juniorResearchers;
      if (staffUsed >= labState.staffCapacity) {
        throw new Error("Staff capacity full");
      }
    }

    // Check freelance cooldown
    if (args.taskType === "freelance_contract") {
      const cooldown = await ctx.db
        .query("freelanceCooldowns")
        .withIndex("by_lab", (q) => q.eq("labId", args.labId))
        .first();

      if (cooldown && cooldown.availableAt > Date.now()) {
        throw new Error("Freelance contract on cooldown");
      }
    }

    // Check parallel task limit
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();

    // Get player level for queue slots
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", lab.userId))
      .first();

    const playerLevel = playerState?.level || 1;
    const queueSlots = getQueueSlotsForLevel(playerLevel);

    if (inProgressTasks.length >= labState.parallelTasks) {
      // Check if player has queue unlocked
      if (queueSlots === 0) {
        throw new Error("Task queue not unlocked yet. Reach level 2 to unlock!");
      }

      // Check queue capacity
      const queuedTasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", args.labId).eq("status", "queued")
        )
        .collect();

      if (queuedTasks.length >= queueSlots) {
        throw new Error(`Queue full! You have ${queueSlots} queue slot(s) at level ${playerLevel}.`);
      }

      // Queue the task
      const taskId = await ctx.db.insert("tasks", {
        labId: args.labId,
        type: args.taskType,
        status: "queued",
        createdAt: Date.now(),
      });

      // Deduct cost
      await ctx.db.patch(labState._id, {
        cash: labState.cash - taskConfig.cost,
      });

      return { taskId, status: "queued", queuePosition: queuedTasks.length + 1 };
    }

    // Calculate duration with modifiers
    const founderMods = FOUNDER_MODIFIERS[lab.founderType];
    let duration = taskConfig.duration;

    // Apply research speed modifier for training
    if (args.taskType.startsWith("train_")) {
      duration = duration / founderMods.researchSpeed;
    }
    // Apply hiring speed modifier
    if (args.taskType === "hire_junior_researcher") {
      duration = duration / founderMods.hiringSpeed;
    }

    // Apply level bonus (reuse playerState from above)
    if (playerState) {
      const levelBonus = 1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
      duration = duration / levelBonus;
    }

    // Apply research speed bonus from staff
    if (args.taskType.startsWith("train_") && labState.juniorResearchers > 0) {
      const staffBonus = 1 + labState.juniorResearchers * 0.1;
      duration = duration / staffBonus;
    }

    const now = Date.now();
    const completesAt = now + duration;

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      labId: args.labId,
      type: args.taskType,
      status: "in_progress",
      startedAt: now,
      completesAt,
      createdAt: now,
    });

    // Deduct cost
    await ctx.db.patch(labState._id, {
      cash: labState.cash - taskConfig.cost,
    });

    // Set freelance cooldown
    if (args.taskType === "freelance_contract") {
      const existingCooldown = await ctx.db
        .query("freelanceCooldowns")
        .withIndex("by_lab", (q) => q.eq("labId", args.labId))
        .first();

      const cooldownDuration = TASKS.freelance_contract.cooldown || 5 * 60 * 1000;
      if (existingCooldown) {
        await ctx.db.patch(existingCooldown._id, {
          availableAt: completesAt + cooldownDuration,
        });
      } else {
        await ctx.db.insert("freelanceCooldowns", {
          labId: args.labId,
          availableAt: completesAt + cooldownDuration,
        });
      }
    }

    // Schedule completion
    await ctx.scheduler.runAt(completesAt, internal.tasks.completeTask, {
      taskId,
    });

    return { taskId, status: "in_progress", completesAt };
  },
});

// Complete a task (internal, called by scheduler)
export const completeTask = internalMutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "completed") return;

    const lab = await ctx.db.get(task.labId);
    if (!lab) return;

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", task.labId))
      .first();
    if (!labState) return;

    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", lab.userId))
      .first();
    if (!playerState) return;

    const taskConfig = TASKS[task.type] as TaskConfig;
    const founderMods = FOUNDER_MODIFIERS[lab.founderType];

    // Calculate rewards with modifiers
    const randomFactor = getRandomFactor(
      taskConfig.randomRange.min,
      taskConfig.randomRange.max
    );

    const rewards: {
      cash?: number;
      researchPoints?: number;
      experience?: number;
    } = {};

    // Apply rewards
    if (taskConfig.baseRewards.cash) {
      rewards.cash = Math.floor(
        taskConfig.baseRewards.cash * founderMods.moneyRewards * randomFactor
      );
    }

    if (taskConfig.baseRewards.researchPoints) {
      rewards.researchPoints = Math.floor(
        taskConfig.baseRewards.researchPoints *
          founderMods.modelScore *
          randomFactor
      );
    }

    if (taskConfig.baseRewards.experience) {
      // Apply clan XP bonus if in a clan
      let xpMultiplier = 1;
      if (playerState.clanId) {
        xpMultiplier = CLAN_BONUS.xpGain;
      }
      rewards.experience = Math.floor(
        taskConfig.baseRewards.experience * randomFactor * xpMultiplier
      );
    }

    // Update lab state
    const updates: Partial<typeof labState> = {};
    if (rewards.cash) updates.cash = labState.cash + rewards.cash;
    if (rewards.researchPoints)
      updates.researchPoints = labState.researchPoints + rewards.researchPoints;

    // Handle hiring completion
    if (task.type === "hire_junior_researcher") {
      updates.juniorResearchers = labState.juniorResearchers + 1;
    }

    // Handle GPU rental completion
    if (task.type === "rent_gpu_cluster") {
      updates.computeUnits = labState.computeUnits + 1;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(labState._id, updates);
    }

    // Save trained model to collection
    if (task.type === "train_small_model" || task.type === "train_medium_model") {
      // Count existing models for naming
      const existingModels = await ctx.db
        .query("trainedModels")
        .withIndex("by_lab", (q) => q.eq("labId", task.labId))
        .collect();

      const modelNumber = existingModels.length + 1;
      const modelType = task.type === "train_small_model" ? "small_3b" : "medium_7b";
      const modelName = `${modelType === "small_3b" ? "GPT-Mini" : "GPT-Pro"} #${modelNumber}`;

      await ctx.db.insert("trainedModels", {
        labId: task.labId,
        taskId: args.taskId,
        modelType: modelType as "small_3b" | "medium_7b",
        name: modelName,
        score: rewards.researchPoints || 0,
        trainedAt: Date.now(),
        visibility: "private", // Default to private, player can publish in lab view
      });
    }

    // Update player XP and check level up (max level 20)
    if (rewards.experience) {
      const newXP = playerState.experience + rewards.experience;
      const xpRequired = XP_CURVE[playerState.level] || Infinity;

      if (newXP >= xpRequired && playerState.level < MAX_LEVEL) {
        // Level up!
        const newLevel = playerState.level + 1;
        await ctx.db.patch(playerState._id, {
          experience: newXP - xpRequired,
          level: newLevel,
        });

        // Grant RP reward for leveling up
        const rpReward = RP_REWARDS[newLevel] || 0;
        if (rpReward > 0) {
          // Get fresh lab state for accurate RP
          const freshLabState = await ctx.db
            .query("labState")
            .withIndex("by_lab", (q) => q.eq("labId", task.labId))
            .first();
          if (freshLabState) {
            await ctx.db.patch(freshLabState._id, {
              researchPoints: freshLabState.researchPoints + rpReward,
            });
          }
        }

        // Create level up notification with RP reward
        await ctx.db.insert("notifications", {
          userId: lab.userId,
          type: "level_up",
          title: "Level Up!",
          message: rpReward > 0 
            ? `You've reached level ${newLevel}! +${rpReward} RP`
            : `You've reached level ${newLevel}!`,
          read: false,
          createdAt: Date.now(),
          deepLink: { view: "level" as const },
        });

        // Check for clan unlock
        if (newLevel === LEVEL_REWARDS.clanUnlockLevel) {
          await ctx.db.insert("notifications", {
            userId: lab.userId,
            type: "unlock",
            title: "Clans Unlocked!",
            message: "You can now create or join a clan.",
            read: false,
            createdAt: Date.now(),
          });
        }
      } else {
        await ctx.db.patch(playerState._id, {
          experience: newXP,
        });
      }
    }

    // Mark task complete
    await ctx.db.patch(args.taskId, {
      status: "completed",
      rewards,
    });

    // Create completion notification
    await ctx.db.insert("notifications", {
      userId: lab.userId,
      type: task.type === "hire_junior_researcher" ? "hire_complete" : "task_complete",
      title: `${taskConfig.name} Complete`,
      message: formatRewards(rewards),
      read: false,
      createdAt: Date.now(),
      taskId: args.taskId,
    });

    // Start next queued task if any
    const nextQueued = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", task.labId).eq("status", "queued")
      )
      .first();

    if (nextQueued) {
      // Re-check parallel task limit
      const inProgressCount = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", task.labId).eq("status", "in_progress")
        )
        .collect();

      // Get fresh lab state
      const freshLabState = await ctx.db
        .query("labState")
        .withIndex("by_lab", (q) => q.eq("labId", task.labId))
        .first();

      if (freshLabState && inProgressCount.length < freshLabState.parallelTasks) {
        // Start the queued task
        const now = Date.now();
        const queuedTaskConfig = TASKS[nextQueued.type] as TaskConfig;
        let duration = queuedTaskConfig.duration;

        // Apply modifiers (simplified)
        const levelBonus =
          1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
        duration = duration / levelBonus;

        if (nextQueued.type.startsWith("train_")) {
          duration = duration / founderMods.researchSpeed;
          if (freshLabState.juniorResearchers > 0) {
            duration = duration / (1 + freshLabState.juniorResearchers * 0.1);
          }
        }

        const completesAt = now + duration;

        await ctx.db.patch(nextQueued._id, {
          status: "in_progress",
          startedAt: now,
          completesAt,
        });

        await ctx.scheduler.runAt(completesAt, internal.tasks.completeTask, {
          taskId: nextQueued._id,
        });
      }
    }
  },
});

function formatRewards(rewards: {
  cash?: number;
  researchPoints?: number;
  experience?: number;
}): string {
  const parts: string[] = [];
  if (rewards.cash) parts.push(`+$${rewards.cash}`);
  if (rewards.researchPoints) parts.push(`+${rewards.researchPoints} RP`);
  if (rewards.experience) parts.push(`+${rewards.experience} XP`);
  return parts.join(", ") || "Task completed";
}

// Get active tasks for a lab
export const getActiveTasks = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .order("desc")
      .collect();

    return tasks.filter(
      (t) => t.status === "in_progress" || t.status === "queued"
    );
  },
});

// Get task history
export const getTaskHistory = query({
  args: { labId: v.id("labs"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .order("desc")
      .take(args.limit || 20);

    return tasks;
  },
});

// Get freelance cooldown
export const getFreelanceCooldown = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const cooldown = await ctx.db
      .query("freelanceCooldowns")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    if (!cooldown) return null;
    if (cooldown.availableAt <= Date.now()) return null;
    return cooldown.availableAt;
  },
});

// Check if can afford task
export const canAffordTask = query({
  args: {
    labId: v.id("labs"),
    taskType: v.union(
      v.literal("train_small_model"),
      v.literal("train_medium_model"),
      v.literal("freelance_contract"),
      v.literal("hire_junior_researcher"),
      v.literal("rent_gpu_cluster")
    ),
  },
  handler: async (ctx, args) => {
    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    if (!labState) return { canAfford: false, reason: "Lab not found" };

    const taskConfig = TASKS[args.taskType] as TaskConfig;

    if (labState.cash < taskConfig.cost) {
      return { canAfford: false, reason: "Not enough cash" };
    }

    if (args.taskType === "hire_junior_researcher") {
      if (labState.juniorResearchers >= labState.staffCapacity) {
        return { canAfford: false, reason: "Staff capacity full" };
      }
    }

    return { canAfford: true };
  },
});

// Get queue status for a user
export const getQueueStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const level = playerState?.level || 1;
    const queueSlots = getQueueSlotsForLevel(level);
    const nextUnlockLevel = Object.keys(LEVEL_REWARDS.queueUnlocks)
      .map(Number)
      .find((l) => l > level);

    return {
      unlocked: queueSlots > 0,
      slots: queueSlots,
      nextUnlockLevel,
      nextUnlockSlots: nextUnlockLevel
        ? LEVEL_REWARDS.queueUnlocks[nextUnlockLevel]
        : null,
    };
  },
});

// Get trained models for a lab
export const getTrainedModels = query({
  args: { labId: v.id("labs"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .order("desc")
      .take(args.limit || 50);

    return models;
  },
});

// Get model stats
export const getModelStats = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    const smallModels = models.filter((m) => m.modelType === "small_3b");
    const mediumModels = models.filter((m) => m.modelType === "medium_7b");
    const publicModels = models.filter((m) => m.visibility === "public"); // undefined = private

    const totalScore = models.reduce((sum, m) => sum + m.score, 0);
    const bestModel = models.reduce(
      (best, m) => (m.score > (best?.score || 0) ? m : best),
      null as (typeof models)[0] | null
    );

    return {
      totalModels: models.length,
      smallModels: smallModels.length,
      mediumModels: mediumModels.length,
      publicModels: publicModels.length,
      totalScore,
      averageScore: models.length > 0 ? Math.round(totalScore / models.length) : 0,
      bestModel,
    };
  },
});

// Toggle model visibility (public/private)
export const toggleModelVisibility = mutation({
  args: { modelId: v.id("trainedModels") },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    const newVisibility = model.visibility === "public" ? "private" : "public";
    await ctx.db.patch(args.modelId, { visibility: newVisibility });

    return { modelId: args.modelId, visibility: newVisibility };
  },
});

// Get public models for leaderboards
export const getPublicModels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(args.limit || 100);

    // Get lab info for each model
    const modelsWithLabs = await Promise.all(
      models.map(async (model) => {
        const lab = await ctx.db.get(model.labId);
        return {
          ...model,
          labName: lab?.name || "Unknown Lab",
        };
      })
    );

    // Sort by score for leaderboard
    return modelsWithLabs.sort((a, b) => b.score - a.score);
  },
});

// Get leaderboard data
export const getLeaderboard = query({
  args: { 
    type: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("allTime")),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let models = await ctx.db
      .query("trainedModels")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .collect();

    // Filter by time period
    if (args.type === "weekly") {
      models = models.filter((m) => m.trainedAt >= weekAgo);
    } else if (args.type === "monthly") {
      models = models.filter((m) => m.trainedAt >= monthAgo);
    }

    // Group by lab and sum scores
    const labScores: Record<string, { labId: string; labName: string; totalScore: number; modelCount: number }> = {};

    for (const model of models) {
      const lab = await ctx.db.get(model.labId);
      const labIdStr = model.labId.toString();
      
      if (!labScores[labIdStr]) {
        labScores[labIdStr] = {
          labId: labIdStr,
          labName: lab?.name || "Unknown Lab",
          totalScore: 0,
          modelCount: 0,
        };
      }
      labScores[labIdStr].totalScore += model.score;
      labScores[labIdStr].modelCount += 1;
    }

    // Sort by total score
    const leaderboard = Object.values(labScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, args.limit || 50);

    return leaderboard;
  },
});

