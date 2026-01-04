import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  JOB_DEFS,
  getJobById,
  getBlueprintById,
  calculateModelScore,
  INBOX_EVENTS,
  type JobDefinition,
  type ModelType,
} from "./lib/contentCatalog";
import {
  FOUNDER_MODIFIERS,
  MAX_LEVEL,
  UP_PER_LEVEL,
  getUpgradeValue,
  getXpForNextLevel,
  type FounderType,
} from "./lib/gameConfig";
import { LEVEL_REWARDS, CLAN_BONUS } from "./lib/gameConstants";
import { internal } from "./_generated/api";

// Default unlocks for new players
const DEFAULT_UNLOCKS = {
  unlockedBlueprintIds: [] as string[],
  unlockedJobIds: ["job_research_literature"], // Always available
  enabledSystemFlags: [] as string[],
};

// Get player unlocks (read-only, returns defaults if not found)
async function getPlayerUnlocksOrDefaults(ctx: any, userId: any) {
  const unlocks = await ctx.db
    .query("playerUnlocks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!unlocks) {
    return { _id: null, userId, ...DEFAULT_UNLOCKS };
  }

  return unlocks;
}

// Get or create player unlocks (for mutations only)
async function getOrCreatePlayerUnlocks(ctx: any, userId: any) {
  let unlocks = await ctx.db
    .query("playerUnlocks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!unlocks) {
    const newId = await ctx.db.insert("playerUnlocks", {
      userId,
      ...DEFAULT_UNLOCKS,
    });
    unlocks = await ctx.db.get(newId);
  }

  return unlocks;
}

// Check if a job is available to the player (read-only)
async function checkJobAvailability(
  ctx: any,
  userId: any,
  labId: any,
  jobDef: JobDefinition
): Promise<{ available: boolean; reason?: string }> {
  const playerState = await ctx.db
    .query("playerState")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  const playerLevel = playerState?.level || 1;

  // Check level requirement
  if (playerLevel < jobDef.requirements.minLevel) {
    return { available: false, reason: `Requires level ${jobDef.requirements.minLevel}` };
  }

  const unlocks = await getPlayerUnlocksOrDefaults(ctx, userId);

  // Check if job is unlocked via research
  if (!unlocks.unlockedJobIds?.includes(jobDef.jobId)) {
    // Check if required research nodes are purchased
    if (jobDef.requirements.requiredResearchNodeIds?.length) {
      return { available: false, reason: `Unlock via Research` };
    }
  }

  // Check blueprint requirement (for training jobs)
  if (jobDef.requirements.requiredBlueprintIds?.length) {
    const hasAllBlueprints = jobDef.requirements.requiredBlueprintIds.every(
      (bpId) => unlocks.unlockedBlueprintIds?.includes(bpId)
    );
    if (!hasAllBlueprints) {
      return { available: false, reason: `Blueprint not unlocked` };
    }
  }

  // Check if player has required model type (for contracts)
  if (jobDef.requirements.requiredModelType) {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q: any) => q.eq("labId", labId))
      .collect();

    const hasModelType = models.some(
      (m: any) => m.modelType === jobDef.requirements.requiredModelType
    );

    if (!hasModelType) {
      return {
        available: false,
        reason: `Need a trained ${jobDef.requirements.requiredModelType.toUpperCase()} model`,
      };
    }
  }

  return { available: true };
}

// Get available jobs for a player
export const getAvailableJobs = query({
  args: { userId: v.id("users"), labId: v.id("labs") },
  handler: async (ctx, args) => {
    const unlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    const playerLevel = playerState?.level || 1;
    const cash = labState?.cash || 0;

    const jobs = await Promise.all(
      JOB_DEFS.map(async (jobDef) => {
        const availability = await checkJobAvailability(
          ctx,
          args.userId,
          args.labId,
          jobDef
        );

        // Check if can afford
        const canAfford = cash >= jobDef.moneyCost;

        // For contracts, find the best model to use
        let bestModel = null;
        if (jobDef.output.usesBlueprintType) {
          const typeModels = models.filter(
            (m) => m.modelType === jobDef.output.usesBlueprintType
          );
          if (typeModels.length > 0) {
            bestModel = typeModels.reduce((best, m) =>
              m.score > (best?.score || 0) ? m : best
            );
          }
        }

        return {
          ...jobDef,
          isUnlocked: availability.available,
          lockReason: availability.reason,
          canAfford,
          meetsLevel: playerLevel >= jobDef.requirements.minLevel,
          bestModelForContract: bestModel
            ? { name: bestModel.name, score: bestModel.score }
            : null,
        };
      })
    );

    return jobs;
  },
});

// Start a job (new blueprint-driven system)
export const startJob = mutation({
  args: {
    labId: v.id("labs"),
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobDef = getJobById(args.jobId);
    if (!jobDef) {
      throw new Error("Job not found");
    }

    // Get lab and state
    const lab = await ctx.db.get(args.labId);
    if (!lab) throw new Error("Lab not found");

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();
    if (!labState) throw new Error("Lab state not found");

    // Check availability
    const availability = await checkJobAvailability(
      ctx,
      lab.userId,
      args.labId,
      jobDef
    );
    if (!availability.available) {
      throw new Error(availability.reason || "Job not available");
    }

    // Check cost
    if (labState.cash < jobDef.moneyCost) {
      throw new Error("Not enough cash");
    }

    // Check compute (for jobs that need it)
    if (jobDef.computeRequiredCU > 0) {
      const activeTasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", args.labId).eq("status", "in_progress")
        )
        .collect();

      // Get compute capacity from UP rank
      const playerStateForCompute = await ctx.db
        .query("playerState")
        .withIndex("by_user", (q) => q.eq("userId", lab.userId))
        .first();
      const computeRank = playerStateForCompute?.computeRank ?? 0;
      const computeCapacity = getUpgradeValue("compute", computeRank);

      // Sum compute used by active tasks
      let usedCompute = 0;
      for (const task of activeTasks) {
        const taskJob = getJobById(task.type);
        if (taskJob) {
          usedCompute += taskJob.computeRequiredCU;
        } else {
          // Legacy tasks use 1 CU for training
          if (task.type.startsWith("train_")) {
            usedCompute += 1;
          }
        }
      }

      if (usedCompute + jobDef.computeRequiredCU > computeCapacity) {
        throw new Error("Not enough compute units");
      }
    }

    // Check parallel task limit
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();

    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", lab.userId))
      .first();

    const queueRank = playerState?.queueRank ?? 0;
    const baseQueueSlots = getUpgradeValue("queue", queueRank);
    const maxParallelTasks = baseQueueSlots + labState.juniorResearchers;

    if (inProgressTasks.length >= maxParallelTasks) {
      throw new Error(
        `All ${maxParallelTasks} task slot(s) in use. Wait for a task to complete or upgrade Queue Capacity.`
      );
    }

    // Calculate duration with modifiers
    const founderMods = FOUNDER_MODIFIERS[lab.founderType as FounderType];
    let duration = jobDef.durationMs;

    // Apply research speed modifier for training
    if (jobDef.category === "training") {
      duration = duration / founderMods.researchSpeed;
    }

    // Apply level bonus
    if (playerState) {
      const levelBonus =
        1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
      duration = duration / levelBonus;
    }

    // Apply research speed bonus from perks
    const speedBonus = labState.researchSpeedBonus || 0;
    if (speedBonus > 0) {
      duration = duration / (1 + speedBonus / 100);
    }

    // Apply staff bonus for training
    if (jobDef.category === "training" && labState.juniorResearchers > 0) {
      const staffBonus = 1 + labState.juniorResearchers * 0.1;
      duration = duration / staffBonus;
    }

    const now = Date.now();
    const completesAt = now + duration;

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      labId: args.labId,
      type: args.jobId,
      status: "in_progress",
      startedAt: now,
      completesAt,
      createdAt: now,
    });

    // Deduct cost
    await ctx.db.patch(labState._id, {
      cash: labState.cash - jobDef.moneyCost,
    });

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

    // Get job definition (supports both new and legacy task types)
    const jobDef = getJobById(task.type);
    const founderMods = FOUNDER_MODIFIERS[lab.founderType as FounderType];

    // Calculate rewards
    const rewards: {
      cash?: number;
      researchPoints?: number;
      experience?: number;
    } = {};

    if (jobDef) {
      // New blueprint-driven job system
      const moneyMultiplier = labState.moneyMultiplier || 1.0;
      const researchSpeedBonus = labState.researchSpeedBonus || 0;

      if (jobDef.rewards.money > 0) {
        rewards.cash = Math.floor(
          jobDef.rewards.money * founderMods.moneyRewards * moneyMultiplier
        );
      }

      if (jobDef.rewards.rp > 0) {
        const rpBonus = 1 + researchSpeedBonus / 100;
        rewards.researchPoints = Math.floor(jobDef.rewards.rp * rpBonus);
      }

      if (jobDef.rewards.xp > 0) {
        let xpMultiplier = 1;
        if (playerState.clanId) {
          xpMultiplier = CLAN_BONUS.xpGain;
        }
        rewards.experience = Math.floor(jobDef.rewards.xp * xpMultiplier);
      }

      // Handle training job output - create trained model
      if (jobDef.output.trainsBlueprintId) {
        const blueprint = getBlueprintById(jobDef.output.trainsBlueprintId);
        if (blueprint) {
          // Get existing models for this blueprint to determine version
          const existingModels = await ctx.db
            .query("trainedModels")
            .withIndex("by_lab_blueprint", (q) =>
              q.eq("labId", task.labId).eq("blueprintId", blueprint.id)
            )
            .collect();

          const version = existingModels.length + 1;
          const modelName = `${blueprint.name} v${version}`;
          const score = calculateModelScore(blueprint, labState.researchSpeedBonus);

          await ctx.db.insert("trainedModels", {
            labId: task.labId,
            taskId: args.taskId,
            blueprintId: blueprint.id,
            modelType: blueprint.type,
            name: modelName,
            version,
            score,
            trainedAt: Date.now(),
            visibility: "private",
          });

          // Check for first model milestone
          if (existingModels.length === 0) {
            // Count all models to see if this is truly the first
            const allModels = await ctx.db
              .query("trainedModels")
              .withIndex("by_lab", (q) => q.eq("labId", task.labId))
              .collect();

            if (allModels.length === 0) {
              const milestoneEvent = INBOX_EVENTS.find(
                (e) => e.trigger === "first_model"
              );
              if (milestoneEvent) {
                const existingEvent = await ctx.db
                  .query("notifications")
                  .withIndex("by_user_event", (q) =>
                    q
                      .eq("userId", lab.userId)
                      .eq("eventId", milestoneEvent.eventId)
                  )
                  .first();

                if (!existingEvent) {
                  await ctx.db.insert("notifications", {
                    userId: lab.userId,
                    type: "milestone",
                    title: milestoneEvent.title,
                    message: milestoneEvent.message,
                    read: false,
                    createdAt: Date.now(),
                    eventId: milestoneEvent.eventId,
                    deepLink: milestoneEvent.deepLink,
                  });
                }
              }
            }
          }
        }
      }
    } else {
      // Legacy task type handling for backwards compatibility
      const legacyRewards = getLegacyTaskRewards(task.type, founderMods);
      Object.assign(rewards, legacyRewards);

      // Handle legacy training task output
      if (task.type === "train_small_model" || task.type === "train_medium_model") {
        await handleLegacyTrainingCompletion(ctx, task, args.taskId, rewards);
      }
    }

    // Update lab state
    const updates: Partial<typeof labState> = {};
    if (rewards.cash) updates.cash = labState.cash + rewards.cash;
    if (rewards.researchPoints)
      updates.researchPoints = labState.researchPoints + rewards.researchPoints;

    // Handle hiring completion (legacy)
    if (task.type === "hire_junior_researcher") {
      updates.juniorResearchers = labState.juniorResearchers + 1;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(labState._id, updates);
    }

    // Update player XP and check level up
    if (rewards.experience) {
      let currentXP = playerState.experience + rewards.experience;
      let currentLevel = playerState.level;
      let levelsGained = 0;

      while (currentLevel < MAX_LEVEL) {
        const xpNeeded = getXpForNextLevel(currentLevel);
        if (currentXP >= xpNeeded) {
          currentXP -= xpNeeded;
          currentLevel++;
          levelsGained++;
        } else {
          break;
        }
      }

      if (levelsGained > 0) {
        const currentUP = playerState.upgradePoints ?? 0;

        await ctx.db.patch(playerState._id, {
          experience: currentXP,
          level: currentLevel,
          upgradePoints: currentUP + UP_PER_LEVEL * levelsGained,
        });

        // Check for first level up milestone
        if (playerState.level === 1 && currentLevel >= 2) {
          const milestoneEvent = INBOX_EVENTS.find(
            (e) => e.trigger === "first_level_up"
          );
          if (milestoneEvent) {
            const existingEvent = await ctx.db
              .query("notifications")
              .withIndex("by_user_event", (q) =>
                q.eq("userId", lab.userId).eq("eventId", milestoneEvent.eventId)
              )
              .first();

            if (!existingEvent) {
              await ctx.db.insert("notifications", {
                userId: lab.userId,
                type: "milestone",
                title: milestoneEvent.title,
                message: milestoneEvent.message,
                read: false,
                createdAt: Date.now(),
                eventId: milestoneEvent.eventId,
                deepLink: milestoneEvent.deepLink,
              });
            }
          }
        }

        // Check for level 5 milestone
        if (playerState.level < 5 && currentLevel >= 5) {
          const milestoneEvent = INBOX_EVENTS.find(
            (e) => e.trigger === "level_5"
          );
          if (milestoneEvent) {
            const existingEvent = await ctx.db
              .query("notifications")
              .withIndex("by_user_event", (q) =>
                q.eq("userId", lab.userId).eq("eventId", milestoneEvent.eventId)
              )
              .first();

            if (!existingEvent) {
              await ctx.db.insert("notifications", {
                userId: lab.userId,
                type: "milestone",
                title: milestoneEvent.title,
                message: milestoneEvent.message,
                read: false,
                createdAt: Date.now(),
                eventId: milestoneEvent.eventId,
                deepLink: milestoneEvent.deepLink,
              });
            }
          }
        }

        // Create level up notification
        await ctx.db.insert("notifications", {
          userId: lab.userId,
          type: "level_up",
          title: "Level Up!",
          message: `You've reached level ${currentLevel}! +${UP_PER_LEVEL * levelsGained} UP`,
          read: false,
          createdAt: Date.now(),
          deepLink: { view: "lab" as const, target: "upgrades" },
        });

        // Check for clan unlock
        if (
          currentLevel >= LEVEL_REWARDS.clanUnlockLevel &&
          playerState.level < LEVEL_REWARDS.clanUnlockLevel
        ) {
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
          experience: currentXP,
        });
      }
    }

    // Mark task complete
    await ctx.db.patch(args.taskId, {
      status: "completed",
      rewards,
    });

    // Create completion notification
    const jobName = jobDef?.name || task.type.replace(/_/g, " ");
    await ctx.db.insert("notifications", {
      userId: lab.userId,
      type: task.type === "hire_junior_researcher" ? "hire_complete" : "task_complete",
      title: `${jobName} Complete`,
      message: formatRewards(rewards),
      read: false,
      createdAt: Date.now(),
      taskId: args.taskId,
    });

    // Start next queued task if any
    await startNextQueuedTask(ctx, task.labId, lab.userId, playerState, founderMods);
  },
});

// Helper to start next queued task
async function startNextQueuedTask(
  ctx: any,
  labId: any,
  userId: any,
  playerState: any,
  founderMods: any
) {
  const nextQueued = await ctx.db
    .query("tasks")
    .withIndex("by_lab_status", (q: any) =>
      q.eq("labId", labId).eq("status", "queued")
    )
    .first();

  if (!nextQueued) return;

  const inProgressCount = await ctx.db
    .query("tasks")
    .withIndex("by_lab_status", (q: any) =>
      q.eq("labId", labId).eq("status", "in_progress")
    )
    .collect();

  const freshLabState = await ctx.db
    .query("labState")
    .withIndex("by_lab", (q: any) => q.eq("labId", labId))
    .first();

  const queueRank = playerState.queueRank ?? 0;
  const baseQueueSlots = getUpgradeValue("queue", queueRank);
  const maxParallelTasks = baseQueueSlots + (freshLabState?.juniorResearchers || 0);

  if (!freshLabState || inProgressCount.length >= maxParallelTasks) return;

  const now = Date.now();
  const jobDef = getJobById(nextQueued.type);
  let duration = jobDef?.durationMs || 5 * 60 * 1000;

  const levelBonus =
    1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
  duration = duration / levelBonus;

  if (jobDef?.category === "training") {
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

// Legacy task rewards helper
function getLegacyTaskRewards(taskType: string, founderMods: any) {
  const rewards: { cash?: number; researchPoints?: number; experience?: number } = {};
  const randomFactor = 0.9 + Math.random() * 0.2;

  switch (taskType) {
    case "train_small_model":
      rewards.researchPoints = Math.floor(120 * founderMods.modelScore * randomFactor);
      rewards.experience = Math.floor(25 * randomFactor);
      break;
    case "train_medium_model":
      rewards.researchPoints = Math.floor(260 * founderMods.modelScore * randomFactor);
      rewards.experience = Math.floor(60 * randomFactor);
      break;
    case "freelance_contract":
      rewards.cash = Math.floor(400 * founderMods.moneyRewards);
      rewards.experience = 10;
      break;
    case "hire_junior_researcher":
      rewards.experience = 50;
      break;
  }

  return rewards;
}

// Legacy training completion handler
async function handleLegacyTrainingCompletion(
  ctx: any,
  task: any,
  taskId: any,
  rewards: any
) {
  const existingModels = await ctx.db
    .query("trainedModels")
    .withIndex("by_lab", (q: any) => q.eq("labId", task.labId))
    .collect();

  const modelNumber = existingModels.length + 1;

  // Map legacy types to new blueprint system
  let blueprintId: string;
  let modelType: ModelType;
  let modelName: string;

  if (task.type === "train_small_model") {
    blueprintId = "bp_tts_3b";
    modelType = "tts";
    modelName = `3B TTS v${modelNumber}`;
  } else {
    blueprintId = "bp_vlm_7b";
    modelType = "vlm";
    modelName = `7B VLM v${modelNumber}`;
  }

  await ctx.db.insert("trainedModels", {
    labId: task.labId,
    taskId: taskId,
    blueprintId,
    modelType,
    name: modelName,
    version: modelNumber,
    score: rewards.researchPoints || 0,
    trainedAt: Date.now(),
    visibility: "private",
  });
}

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

// ============================================================================
// LEGACY MUTATIONS (kept for backwards compatibility)
// ============================================================================

// Start a task (legacy - redirects to new system where possible)
export const startTask = mutation({
  args: {
    labId: v.id("labs"),
    taskType: v.union(
      v.literal("train_small_model"),
      v.literal("train_medium_model"),
      v.literal("freelance_contract"),
      v.literal("hire_junior_researcher")
    ),
  },
  handler: async (ctx, args): Promise<{ taskId: any; status: string; completesAt: number }> => {
    // Map legacy task types to new job IDs where applicable
    const legacyToJobMap: Record<string, string> = {
      train_small_model: "job_train_tts_3b",
      train_medium_model: "job_train_vlm_7b",
    };

    // For training tasks, try the new system first
    const newJobId = legacyToJobMap[args.taskType];
    if (newJobId) {
      const jobDef = getJobById(newJobId);
      if (jobDef) {
        const lab = await ctx.db.get(args.labId);
        if (lab) {
          const unlocks = await getOrCreatePlayerUnlocks(ctx, lab.userId);
          // Check if new blueprint is unlocked
          if (unlocks.unlockedBlueprintIds?.includes(jobDef.requirements.requiredBlueprintIds?.[0] || "")) {
            // Use new system
            const result = await ctx.runMutation(internal.tasks.startJobInternal, {
              labId: args.labId,
              jobId: newJobId,
            });
            return result as { taskId: any; status: string; completesAt: number };
          }
        }
      }
    }

    // Fall back to legacy implementation
    return await startTaskLegacy(ctx, args);
  },
});

// Internal version of startJob for calling from startTask
export const startJobInternal = internalMutation({
  args: {
    labId: v.id("labs"),
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobDef = getJobById(args.jobId);
    if (!jobDef) {
      throw new Error("Job not found");
    }

    const lab = await ctx.db.get(args.labId);
    if (!lab) throw new Error("Lab not found");

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();
    if (!labState) throw new Error("Lab state not found");

    // Check cost
    if (labState.cash < jobDef.moneyCost) {
      throw new Error("Not enough cash");
    }

    // Check parallel task limit
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();

    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", lab.userId))
      .first();

    const queueRank = playerState?.queueRank ?? 0;
    const baseQueueSlots = getUpgradeValue("queue", queueRank);
    const maxParallelTasks = baseQueueSlots + labState.juniorResearchers;

    if (inProgressTasks.length >= maxParallelTasks) {
      throw new Error(
        `All ${maxParallelTasks} task slot(s) in use.`
      );
    }

    // Calculate duration
    const founderMods = FOUNDER_MODIFIERS[lab.founderType as FounderType];
    let duration = jobDef.durationMs;

    if (jobDef.category === "training") {
      duration = duration / founderMods.researchSpeed;
    }

    if (playerState) {
      const levelBonus =
        1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
      duration = duration / levelBonus;
    }

    const now = Date.now();
    const completesAt = now + duration;

    const taskId = await ctx.db.insert("tasks", {
      labId: args.labId,
      type: args.jobId,
      status: "in_progress",
      startedAt: now,
      completesAt,
      createdAt: now,
    });

    await ctx.db.patch(labState._id, {
      cash: labState.cash - jobDef.moneyCost,
    });

    await ctx.scheduler.runAt(completesAt, internal.tasks.completeTask, {
      taskId,
    });

    return { taskId, status: "in_progress", completesAt };
  },
});

// Legacy startTask implementation
async function startTaskLegacy(ctx: any, args: { labId: any; taskType: string }) {
  const LEGACY_TASKS: Record<string, any> = {
    train_small_model: {
      name: "Train Small Model (3B)",
      duration: 5 * 60 * 1000,
      cost: 500,
      computeRequired: 1,
    },
    train_medium_model: {
      name: "Train Medium Model (7B)",
      duration: 12 * 60 * 1000,
      cost: 1200,
      computeRequired: 1,
    },
    freelance_contract: {
      name: "Freelance AI Contract",
      duration: 3 * 60 * 1000,
      cost: 0,
      computeRequired: 0,
      cooldown: 5 * 60 * 1000,
    },
    hire_junior_researcher: {
      name: "Hire Junior Researcher",
      duration: 2 * 60 * 1000,
      cost: 2000,
      computeRequired: 0,
    },
  };

  const taskConfig = LEGACY_TASKS[args.taskType];
  if (!taskConfig) throw new Error("Unknown task type");

  const lab = await ctx.db.get(args.labId);
  if (!lab) throw new Error("Lab not found");

  const labState = await ctx.db
    .query("labState")
    .withIndex("by_lab", (q: any) => q.eq("labId", args.labId))
    .first();
  if (!labState) throw new Error("Lab state not found");

  if (labState.cash < taskConfig.cost) {
    throw new Error("Not enough cash");
  }

  // Check compute
  if (taskConfig.computeRequired > 0) {
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q: any) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();

    const playerStateForCompute = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q: any) => q.eq("userId", lab.userId))
      .first();
    const computeRank = playerStateForCompute?.computeRank ?? 0;
    const computeCapacity = getUpgradeValue("compute", computeRank);

    const usedCompute = activeTasks.filter(
      (t: any) => t.type === "train_small_model" || t.type === "train_medium_model"
    ).length;

    if (usedCompute >= computeCapacity) {
      throw new Error("Not enough compute units");
    }
  }

  // Check staff capacity for hiring
  if (args.taskType === "hire_junior_researcher") {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q: any) => q.eq("userId", lab.userId))
      .first();
    const staffRank = playerState?.staffRank ?? 0;
    const staffCapacity = getUpgradeValue("staff", staffRank);

    if (labState.juniorResearchers >= staffCapacity) {
      throw new Error("Staff capacity full");
    }
  }

  // Check freelance cooldown
  if (args.taskType === "freelance_contract") {
    const cooldown = await ctx.db
      .query("freelanceCooldowns")
      .withIndex("by_lab", (q: any) => q.eq("labId", args.labId))
      .first();

    if (cooldown && cooldown.availableAt > Date.now()) {
      throw new Error("Freelance contract on cooldown");
    }
  }

  // Check parallel task limit
  const inProgressTasks = await ctx.db
    .query("tasks")
    .withIndex("by_lab_status", (q: any) =>
      q.eq("labId", args.labId).eq("status", "in_progress")
    )
    .collect();

  const playerState = await ctx.db
    .query("playerState")
    .withIndex("by_user", (q: any) => q.eq("userId", lab.userId))
    .first();

  const queueRank = playerState?.queueRank ?? 0;
  const baseQueueSlots = getUpgradeValue("queue", queueRank);
  const maxParallelTasks = baseQueueSlots + labState.juniorResearchers;

  if (inProgressTasks.length >= maxParallelTasks) {
    throw new Error(
      `All ${maxParallelTasks} task slot(s) in use. Wait for a task to complete or upgrade Queue Capacity.`
    );
  }

  // Calculate duration
  const founderMods = FOUNDER_MODIFIERS[lab.founderType as FounderType];
  let duration = taskConfig.duration;

  if (args.taskType.startsWith("train_")) {
    duration = duration / founderMods.researchSpeed;
  }
  if (args.taskType === "hire_junior_researcher") {
    duration = duration / founderMods.hiringSpeed;
  }

  if (playerState) {
    const levelBonus =
      1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
    duration = duration / levelBonus;
  }

  if (args.taskType.startsWith("train_") && labState.juniorResearchers > 0) {
    const staffBonus = 1 + labState.juniorResearchers * 0.1;
    duration = duration / staffBonus;
  }

  const now = Date.now();
  const completesAt = now + duration;

  const taskId = await ctx.db.insert("tasks", {
    labId: args.labId,
    type: args.taskType,
    status: "in_progress",
    startedAt: now,
    completesAt,
    createdAt: now,
  });

  await ctx.db.patch(labState._id, {
    cash: labState.cash - taskConfig.cost,
  });

  // Set freelance cooldown
  if (args.taskType === "freelance_contract") {
    const existingCooldown = await ctx.db
      .query("freelanceCooldowns")
      .withIndex("by_lab", (q: any) => q.eq("labId", args.labId))
      .first();

    const cooldownDuration = taskConfig.cooldown || 5 * 60 * 1000;
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

  await ctx.scheduler.runAt(completesAt, internal.tasks.completeTask, {
    taskId,
  });

  return { taskId, status: "in_progress", completesAt };
}

// ============================================================================
// QUERIES (existing + enhanced)
// ============================================================================

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
      v.literal("hire_junior_researcher")
    ),
  },
  handler: async (ctx, args) => {
    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    if (!labState) return { canAfford: false, reason: "Lab not found" };

    const LEGACY_COSTS: Record<string, number> = {
      train_small_model: 500,
      train_medium_model: 1200,
      freelance_contract: 0,
      hire_junior_researcher: 2000,
    };

    const cost = LEGACY_COSTS[args.taskType] || 0;

    if (labState.cash < cost) {
      return { canAfford: false, reason: "Not enough cash" };
    }

    if (args.taskType === "hire_junior_researcher") {
      const lab = await ctx.db
        .query("labs")
        .filter((q) => q.eq(q.field("_id"), args.labId))
        .first();
      if (!lab) return { canAfford: false, reason: "Lab not found" };

      const playerState = await ctx.db
        .query("playerState")
        .withIndex("by_user", (q) => q.eq("userId", lab.userId))
        .first();
      const staffRank = playerState?.staffRank ?? 0;
      const staffCapacity = getUpgradeValue("staff", staffRank);

      if (labState.juniorResearchers >= staffCapacity) {
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

    const queueRank = playerState?.queueRank ?? 0;
    const queueSlots = getUpgradeValue("queue", queueRank);

    return {
      unlocked: true,
      slots: queueSlots,
      rank: queueRank,
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

// Get best model by type
export const getBestModelByType = query({
  args: { labId: v.id("labs"), modelType: v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm")) },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    const typeModels = models.filter((m) => m.modelType === args.modelType);
    if (typeModels.length === 0) return null;

    return typeModels.reduce((best, m) =>
      m.score > (best?.score || 0) ? m : best
    );
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

    const llmModels = models.filter((m) => m.modelType === "llm");
    const ttsModels = models.filter((m) => m.modelType === "tts");
    const vlmModels = models.filter((m) => m.modelType === "vlm");
    const publicModels = models.filter((m) => m.visibility === "public");

    const totalScore = models.reduce((sum, m) => sum + m.score, 0);
    const bestModel = models.reduce(
      (best, m) => (m.score > (best?.score || 0) ? m : best),
      null as (typeof models)[0] | null
    );

    return {
      totalModels: models.length,
      llmModels: llmModels.length,
      ttsModels: ttsModels.length,
      vlmModels: vlmModels.length,
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

    // Check if publishing is unlocked
    const lab = await ctx.db.get(model.labId);
    if (!lab) throw new Error("Lab not found");

    const unlocks = await getOrCreatePlayerUnlocks(ctx, lab.userId);

    // Only allow publishing if the publishing flag is enabled
    if (model.visibility !== "public" && !unlocks.enabledSystemFlags?.includes("publishing")) {
      throw new Error("Publishing not unlocked. Research 'Model Publishing' first.");
    }

    const newVisibility = model.visibility === "public" ? "private" : "public";
    await ctx.db.patch(args.modelId, { visibility: newVisibility });

    return { modelId: args.modelId, visibility: newVisibility };
  },
});

// Get public models for leaderboards
export const getPublicModels = query({
  args: { limit: v.optional(v.number()), modelType: v.optional(v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm"))) },
  handler: async (ctx, args) => {
    let models = await ctx.db
      .query("trainedModels")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .collect();

    // Filter by model type if specified
    if (args.modelType) {
      models = models.filter((m) => m.modelType === args.modelType);
    }

    models = models.slice(0, args.limit || 100);

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
    modelType: v.optional(v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm"))),
    limit: v.optional(v.number()),
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

    // Filter by model type if specified
    if (args.modelType) {
      models = models.filter((m) => m.modelType === args.modelType);
    }

    // Group by lab and sum scores
    const labScores: Record<
      string,
      { labId: string; labName: string; totalScore: number; modelCount: number }
    > = {};

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
