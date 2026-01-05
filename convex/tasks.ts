import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  JOB_DEFS,
  RESEARCH_NODES,
  getJobById,
  getBlueprintById,
  calculateModelScore,
  INBOX_EVENTS,
  type JobDefinition,
} from "./lib/contentCatalog";
import {
  FOUNDER_MODIFIERS,
  MAX_LEVEL,
  UP_PER_LEVEL,
  getUpgradeValue,
  getXpForNextLevel,
  type FounderType,
} from "./lib/gameConfig";
import { LEVEL_REWARDS } from "./lib/gameConstants";
import { internal } from "./_generated/api";
import { syncLeaderboardForLab } from "./leaderboard";

// Dynamic starter unlocks - auto-unlock free research nodes (costRP=0, minLevel=1, no prereqs)
function getStarterUnlocks() {
  const starterBlueprintIds: string[] = [];
  const starterJobIds: string[] = ["job_research_literature"]; // Always available
  const starterFlags: string[] = [];

  for (const node of RESEARCH_NODES) {
    if (node.costRP === 0 && node.minLevel === 1 && node.prerequisiteNodes.length === 0) {
      if (node.unlocks.unlocksBlueprintIds) {
        starterBlueprintIds.push(...node.unlocks.unlocksBlueprintIds);
      }
      if (node.unlocks.unlocksJobIds) {
        starterJobIds.push(...node.unlocks.unlocksJobIds);
      }
      if (node.unlocks.enablesSystemFlags) {
        starterFlags.push(...node.unlocks.enablesSystemFlags);
      }
    }
  }

  return {
    unlockedBlueprintIds: starterBlueprintIds,
    unlockedJobIds: starterJobIds,
    enabledSystemFlags: starterFlags,
  };
}

// Get player unlocks (read-only, returns defaults if not found)
async function getPlayerUnlocksOrDefaults(ctx: any, userId: any) {
  const unlocks = await ctx.db
    .query("playerUnlocks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!unlocks) {
    return { _id: null, userId, ...getStarterUnlocks() };
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
        rewards.experience = jobDef.rewards.xp;
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
    }

    // Update lab state
    const updates: Partial<typeof labState> = {};
    if (rewards.cash) updates.cash = labState.cash + rewards.cash;
    if (rewards.researchPoints)
      updates.researchPoints = labState.researchPoints + rewards.researchPoints;

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

    // Sync leaderboard (level/model changes may affect Lab Score)
    await syncLeaderboardForLab(ctx, task.labId);

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
// QUERIES
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
// Publishing is available from day one (006_leaderboard_day1)
export const toggleModelVisibility = mutation({
  args: { modelId: v.id("trainedModels") },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    const newVisibility = model.visibility === "public" ? "private" : "public";
    await ctx.db.patch(args.modelId, { visibility: newVisibility });

    // Sync leaderboard (visibility change affects Lab Score if model is best public)
    await syncLeaderboardForLab(ctx, model.labId);

    return { modelId: args.modelId, visibility: newVisibility };
  },
});
