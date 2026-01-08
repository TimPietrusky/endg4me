import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  CONTENT_CATALOG,
  getContentById,
  getFreeStarters,
  getStarterUnlockIds,
  calculateModelScore,
  INBOX_EVENTS,
  type ContentEntry,
} from "./lib/contentCatalog";
import {
  FOUNDER_BONUSES,
  MAX_LEVEL,
  UP_PER_LEVEL,
  getUpgradeValue,
  getXpForNextLevel,
  type FounderType,
} from "./lib/gameConfig";
import { LEVEL_REWARDS } from "./lib/gameConstants";
import { internal } from "./_generated/api";
import { syncLeaderboardForLab } from "./leaderboard";
import { getEffectiveNow, getRealTimeForEffective } from "./dev";

// Get starter unlocks for new players
function getStarterUnlocks() {
  const starterIds = getStarterUnlockIds();
  return {
    unlockedContentIds: starterIds,
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

// Check if content is unlocked for a player
function isContentUnlocked(contentId: string, unlockedIds: string[]): boolean {
  const content = getContentById(contentId);
  if (!content) return false;
  
  // Always available content (no unlockCostRP defined)
  if (content.unlockCostRP === undefined) return true;
  
  // Free starters (0 RP, level 1, no prerequisite) are always unlocked
  if (content.unlockCostRP === 0 && (content.minLevel ?? 1) === 1 && !content.prerequisite) {
    return true;
  }
  
  // Check if explicitly unlocked
  return unlockedIds.includes(contentId);
}

// Check if a job is available to the player
async function checkJobAvailability(
  ctx: any,
  userId: any,
  labId: any,
  content: ContentEntry
): Promise<{ available: boolean; reason?: string }> {
  const playerState = await ctx.db
    .query("playerState")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  const playerLevel = playerState?.level || 1;

  // Check level requirement
  if (playerLevel < (content.minLevel ?? 1)) {
    return { available: false, reason: `Requires level ${content.minLevel}` };
  }

  const unlocks = await getPlayerUnlocksOrDefaults(ctx, userId);
  const unlockedIds = unlocks.unlockedContentIds || [];

  // Check if content is unlocked
  if (!isContentUnlocked(content.id, unlockedIds)) {
    return { available: false, reason: `Unlock via Research` };
  }

  // Check if player has required model type (for contracts)
  if (content.requiresModelType) {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q: any) => q.eq("labId", labId))
      .collect();

    const hasModelType = models.some(
      (m: any) => m.modelType === content.requiresModelType
    );

    if (!hasModelType) {
      return {
        available: false,
        reason: `Need a trained ${content.requiresModelType.toUpperCase()} model`,
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

    // Filter to content that has jobs (jobDurationMs defined)
    const jobContent = CONTENT_CATALOG.filter((c) => c.jobDurationMs !== undefined);

    const jobs = await Promise.all(
      jobContent.map(async (content) => {
        const availability = await checkJobAvailability(
          ctx,
          args.userId,
          args.labId,
          content
        );

        // Check if can afford
        const canAfford = cash >= (content.jobMoneyCost ?? 0);

        // For contracts, find the best model to use
        let bestModel = null;
        if (content.requiresModelType) {
          const typeModels = models.filter(
            (m) => m.modelType === content.requiresModelType
          );
          if (typeModels.length > 0) {
            bestModel = typeModels.reduce((best, m) =>
              m.score > (best?.score || 0) ? m : best
            );
          }
        }

        return {
          ...content,
          isUnlocked: availability.available,
          lockReason: availability.reason,
          canAfford,
          meetsLevel: playerLevel >= (content.minLevel ?? 1),
          bestModelForContract: bestModel
            ? { name: bestModel.name, score: bestModel.score }
            : null,
        };
      })
    );

    return jobs;
  },
});

// Start a job
export const startJob = mutation({
  args: {
    labId: v.id("labs"),
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const content = getContentById(args.jobId);
    if (!content || !content.jobDurationMs) {
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
      content
    );
    if (!availability.available) {
      throw new Error(availability.reason || "Job not available");
    }

    // Calculate total money multiplier from all sources
    const founderBonuses = FOUNDER_BONUSES[lab.founderType as FounderType];
    const playerStateForMoney = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", lab.userId))
      .first();
    
    // Get UP rank bonus for money multiplier
    const moneyMultiplierRank = playerStateForMoney?.moneyMultiplierRank ?? 0;
    const upMoneyBonus = getUpgradeValue("moneyMultiplier", moneyMultiplierRank) - 100;
    
    // Get active hire bonuses for money multiplier
    const activeTasksForHires = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();
    
    let hireMoneyBonus = 0;
    for (const task of activeTasksForHires) {
      const hireContent = getContentById(task.type);
      if (hireContent?.contentType === "hire" && hireContent.hireStat === "moneyMultiplier") {
        hireMoneyBonus += hireContent.hireBonus ?? 0;
      }
    }
    
    // Total multiplier
    const baseMultiplier = 100;
    const founderMoneyBonus = founderBonuses.moneyMultiplier ?? 0;
    const rpMoneyBonus = (labState.moneyMultiplier ?? 1.0) > 1 ? ((labState.moneyMultiplier ?? 1.0) - 1) * 100 : 0;
    const totalMoneyMultiplier = (baseMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus) / 100;
    
    // Calculate effective cost
    const effectiveCost = Math.floor((content.jobMoneyCost ?? 0) / totalMoneyMultiplier);

    // Check cost
    if (labState.cash < effectiveCost) {
      throw new Error("Not enough cash");
    }

    // Check compute
    if ((content.jobComputeCost ?? 0) > 0) {
      const activeTasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", args.labId).eq("status", "in_progress")
        )
        .collect();

      const playerStateForCompute = await ctx.db
        .query("playerState")
        .withIndex("by_user", (q) => q.eq("userId", lab.userId))
        .first();
      const computeRank = playerStateForCompute?.computeRank ?? 0;
      const computeCapacity = getUpgradeValue("compute", computeRank);

      let usedCompute = 0;
      for (const task of activeTasks) {
        const taskContent = getContentById(task.type);
        if (taskContent) {
          usedCompute += taskContent.jobComputeCost ?? 0;
        }
      }

      if (usedCompute + (content.jobComputeCost ?? 0) > computeCapacity) {
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
        `All ${maxParallelTasks} task slot(s) in use. Wait or upgrade Queue Capacity.`
      );
    }

    // Calculate duration with modifiers
    let duration = content.jobDurationMs;

    if (content.contentType !== "hire") {
      // Apply founder speed bonus
      const founderSpeedBonus = founderBonuses.speed ?? 0;
      if (founderSpeedBonus > 0) {
        duration = duration / (1 + founderSpeedBonus / 100);
      }

      // Apply level bonus
      if (playerState) {
        const levelBonus = 1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
        duration = duration / levelBonus;
      }

      // Apply speed bonus from perks/upgrades
      const speedBonus = labState.speedBonus || 0;
      if (speedBonus > 0) {
        duration = duration / (1 + speedBonus / 100);
      }

      // Apply staff bonus for training
      if (content.contentType === "model" && labState.juniorResearchers > 0) {
        const staffBonus = 1 + labState.juniorResearchers * 0.1;
        duration = duration / staffBonus;
      }
    }

    // Use effective time for Time Warp support
    const effectiveNow = await getEffectiveNow(ctx, lab.userId);
    const effectiveCompletesAt = effectiveNow + duration;

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      labId: args.labId,
      type: args.jobId,
      status: "in_progress",
      startedAt: effectiveNow,
      completesAt: effectiveCompletesAt,
      createdAt: Date.now(),
    });

    // Deduct cost
    await ctx.db.patch(labState._id, {
      cash: labState.cash - effectiveCost,
    });

    // Schedule completion
    const realCompletesAt = await getRealTimeForEffective(ctx, lab.userId, effectiveCompletesAt);
    await ctx.scheduler.runAt(realCompletesAt, internal.tasks.completeTask, {
      taskId,
    });

    return { taskId, status: "in_progress", completesAt: effectiveCompletesAt };
  },
});

// Complete a task
export const completeTask = internalMutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "completed") return;

    const lab = await ctx.db.get(task.labId);
    if (!lab) return;

    // Verify completion using effective time
    const effectiveNow = await getEffectiveNow(ctx, lab.userId);
    if (task.completesAt && effectiveNow < task.completesAt) {
      const realCompletesAt = await getRealTimeForEffective(ctx, lab.userId, task.completesAt);
      await ctx.scheduler.runAt(realCompletesAt, internal.tasks.completeTask, {
        taskId: args.taskId,
      });
      return;
    }

    const content = getContentById(task.type);
    
    // Handle research node completion
    // Check if this is a research unlock task (not a job/training task)
    // Research tasks are for content with unlockCostRP that hasn't been purchased yet
    if (content && content.unlockCostRP !== undefined) {
      // Check if research is already completed
      const existingResearch = await ctx.db
        .query("playerResearch")
        .withIndex("by_user_node", (q) =>
          q.eq("userId", lab.userId).eq("nodeId", task.type)
        )
        .first();

      // If research not purchased yet, this is a research unlock task
      if (!existingResearch) {
        await ctx.runMutation(internal.research.completeResearchNode, {
          userId: lab.userId,
          nodeId: task.type,
        });

        await ctx.db.patch(args.taskId, {
          status: "completed",
          rewards: {},
        });

        await syncLeaderboardForLab(ctx, task.labId);
        return;
      }
    }

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

    const founderBonuses = FOUNDER_BONUSES[lab.founderType as FounderType];

    // Calculate rewards
    const rewards: {
      cash?: number;
      researchPoints?: number;
      experience?: number;
    } = {};

    if (content) {
      // Calculate money multiplier
      const moneyMultiplierRank = playerState?.moneyMultiplierRank ?? 0;
      const upMoneyBonus = getUpgradeValue("moneyMultiplier", moneyMultiplierRank) - 100;
      
      const activeTasksForHires = await ctx.db
        .query("tasks")
        .withIndex("by_lab_status", (q) =>
          q.eq("labId", task.labId).eq("status", "in_progress")
        )
        .collect();
      
      let hireMoneyBonus = 0;
      for (const hireTask of activeTasksForHires) {
        const hireContent = getContentById(hireTask.type);
        if (hireContent?.contentType === "hire" && hireContent.hireStat === "moneyMultiplier") {
          hireMoneyBonus += hireContent.hireBonus ?? 0;
        }
      }
      
      const baseMultiplier = 100;
      const founderMoneyBonus = founderBonuses.moneyMultiplier ?? 0;
      const rpMoneyBonus = (labState.moneyMultiplier ?? 1.0) > 1 ? ((labState.moneyMultiplier ?? 1.0) - 1) * 100 : 0;
      const totalMoneyMultiplier = (baseMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus) / 100;

      if ((content.rewardMoney ?? 0) > 0) {
        rewards.cash = Math.floor((content.rewardMoney ?? 0) * totalMoneyMultiplier);
      }

      if ((content.rewardRP ?? 0) > 0) {
        rewards.researchPoints = content.rewardRP;
      }

      if ((content.rewardXP ?? 0) > 0) {
        rewards.experience = content.rewardXP;
      }

      // Handle training job output - create trained model
      if (content.contentType === "model" && content.modelType && content.scoreRange) {
        const existingModels = await ctx.db
          .query("trainedModels")
          .withIndex("by_lab_blueprint", (q) =>
            q.eq("labId", task.labId).eq("blueprintId", content.id)
          )
          .collect();

        const version = existingModels.length + 1;
        const modelName = `${content.name} v${version}`;
        const score = calculateModelScore(content, labState.speedBonus);

        await ctx.db.insert("trainedModels", {
          labId: task.labId,
          taskId: args.taskId,
          blueprintId: content.id,
          modelType: content.modelType,
          name: modelName,
          version,
          score,
          trainedAt: effectiveNow,
          visibility: "public",
        });

        // Check for first model milestone
        if (existingModels.length === 0) {
          const allModels = await ctx.db
            .query("trainedModels")
            .withIndex("by_lab", (q) => q.eq("labId", task.labId))
            .collect();

          if (allModels.length === 0) {
            const milestoneEvent = INBOX_EVENTS.find((e) => e.trigger === "first_model");
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
          const milestoneEvent = INBOX_EVENTS.find((e) => e.trigger === "first_level_up");
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
          const milestoneEvent = INBOX_EVENTS.find((e) => e.trigger === "level_5");
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
    const jobName = content?.name || task.type;
    await ctx.db.insert("notifications", {
      userId: lab.userId,
      type: content?.contentType === "hire" ? "hire_complete" : "task_complete",
      title: `${jobName} Complete`,
      message: formatRewards(rewards),
      read: false,
      createdAt: Date.now(),
      taskId: args.taskId,
    });

    // Sync leaderboard
    await syncLeaderboardForLab(ctx, task.labId);

    // Start next queued task if any
    await startNextQueuedTask(ctx, task.labId, lab.userId, playerState, founderBonuses);
  },
});

// Helper to start next queued task
async function startNextQueuedTask(
  ctx: any,
  labId: any,
  userId: any,
  playerState: any,
  founderBonuses: Partial<Record<import("./lib/gameConfig").UpgradeType, number>>
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

  const effectiveNow = await getEffectiveNow(ctx, userId);
  const content = getContentById(nextQueued.type);
  let duration = content?.jobDurationMs || 5 * 60 * 1000;

  if (content?.contentType !== "hire") {
    const levelBonus = 1 + (playerState.level - 1) * LEVEL_REWARDS.globalEfficiencyPerLevel;
    duration = duration / levelBonus;

    const founderSpeedBonus = founderBonuses.speed ?? 0;
    if (founderSpeedBonus > 0) {
      duration = duration / (1 + founderSpeedBonus / 100);
    }

    if (content?.contentType === "model" && freshLabState.juniorResearchers > 0) {
      duration = duration / (1 + freshLabState.juniorResearchers * 0.1);
    }
  }

  const effectiveCompletesAt = effectiveNow + duration;

  await ctx.db.patch(nextQueued._id, {
    status: "in_progress",
    startedAt: effectiveNow,
    completesAt: effectiveCompletesAt,
  });

  const realCompletesAt = await getRealTimeForEffective(ctx, userId, effectiveCompletesAt);
  await ctx.scheduler.runAt(realCompletesAt, internal.tasks.completeTask, {
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
    const lab = await ctx.db.get(args.labId);
    if (!lab) return { tasks: [], effectiveNow: Date.now() };

    const effectiveNow = await getEffectiveNow(ctx, lab.userId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .order("desc")
      .collect();

    const activeTasks = tasks.filter(
      (t) => t.status === "in_progress" || t.status === "queued"
    );

    return { tasks: activeTasks, effectiveNow };
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

// Get aggregated models grouped by blueprint
export const getAggregatedModels = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    const byBlueprint: Record<string, typeof models> = {};
    for (const model of models) {
      if (!byBlueprint[model.blueprintId]) {
        byBlueprint[model.blueprintId] = [];
      }
      byBlueprint[model.blueprintId].push(model);
    }

    const aggregated = Object.entries(byBlueprint).map(([blueprintId, versions]) => {
      const sorted = [...versions].sort((a, b) => b.version - a.version);
      const latest = sorted[0];
      const best = sorted.reduce((b, m) => (m.score > b.score ? m : b), sorted[0]);

      return {
        blueprintId,
        modelType: latest.modelType,
        latestVersion: latest.version,
        latestModel: latest,
        bestScore: best.score,
        bestModel: best,
        versionCount: versions.length,
        publicCount: versions.filter((m) => m.visibility === "public").length,
        allVersions: sorted,
      };
    });

    aggregated.sort((a, b) => b.latestModel.trainedAt - a.latestModel.trainedAt);

    return aggregated;
  },
});

// Get training history summary per blueprint
export const getTrainingHistory = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    const history: Record<string, { latestVersion: number; versionCount: number; bestScore: number }> = {};
    
    for (const model of models) {
      const existing = history[model.blueprintId];
      if (!existing) {
        history[model.blueprintId] = {
          latestVersion: model.version,
          versionCount: 1,
          bestScore: model.score,
        };
      } else {
        existing.versionCount++;
        if (model.version > existing.latestVersion) {
          existing.latestVersion = model.version;
        }
        if (model.score > existing.bestScore) {
          existing.bestScore = model.score;
        }
      }
    }

    return history;
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

// Toggle model visibility
export const toggleModelVisibility = mutation({
  args: { modelId: v.id("trainedModels") },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    const newVisibility = model.visibility === "public" ? "private" : "public";
    await ctx.db.patch(args.modelId, { visibility: newVisibility });

    await syncLeaderboardForLab(ctx, model.labId);

    return { modelId: args.modelId, visibility: newVisibility };
  },
});
