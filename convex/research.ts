import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  CONTENT_CATALOG,
  getContentById,
  getAllUnlockables,
  getStarterUnlockIds,
  getResearchCategory,
  INBOX_EVENTS,
  type ContentEntry,
} from "./lib/contentCatalog";
import { FOUNDER_BONUSES, getUpgradeValue, type FounderType } from "./lib/gameConfig";
import { internal } from "./_generated/api";
import { getEffectiveNow, getRealTimeForEffective } from "./dev";

// Get all unlockable content (has unlockCostRP defined)
const ALL_UNLOCKABLES = getAllUnlockables();

// Get research nodes (unlockables only)
export const getResearchNodes = query({
  args: {},
  handler: async () => {
    return ALL_UNLOCKABLES;
  },
});

// Get player's purchased research
export const getPlayerResearch = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerResearch")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Check if player has purchased a specific research node
export const hasResearchNode = query({
  args: { userId: v.id("users"), nodeId: v.string() },
  handler: async (ctx, args) => {
    const research = await ctx.db
      .query("playerResearch")
      .withIndex("by_user_node", (q) =>
        q.eq("userId", args.userId).eq("nodeId", args.nodeId)
      )
      .first();
    return !!research;
  },
});

// Get starter unlocks for new players
function getStarterUnlocks() {
  return {
    unlockedContentIds: getStarterUnlockIds(),
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

// Get or create player unlocks record
async function getOrCreatePlayerUnlocks(ctx: any, userId: any) {
  let unlocks = await ctx.db
    .query("playerUnlocks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!unlocks) {
    const starter = getStarterUnlocks();
    const newId = await ctx.db.insert("playerUnlocks", {
      userId,
      ...starter,
    });
    unlocks = await ctx.db.get(newId);
  }

  return unlocks;
}

// Get player unlocks
export const getPlayerUnlocks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await getPlayerUnlocksOrDefaults(ctx, args.userId);
  },
});

// Check if a specific content is unlocked
export const isContentUnlocked = query({
  args: { userId: v.id("users"), contentId: v.string() },
  handler: async (ctx, args) => {
    const unlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    const ids = unlocks.unlockedContentIds || [];
    
    const content = getContentById(args.contentId);
    if (!content) return false;
    
    // Always available content
    if (content.unlockCostRP === undefined) return true;
    
    return ids.includes(args.contentId);
  },
});

// Helper to check if content's unlocks are already owned (starter items)
function isContentAlreadyUnlocked(
  content: ContentEntry,
  unlockedIds: string[]
): boolean {
  // Free starters are considered unlocked
  if (content.unlockCostRP === 0 && (content.minLevel ?? 1) === 1 && !content.prerequisite) {
    return true;
  }
  return unlockedIds.includes(content.id);
}

// Start researching a node
export const purchaseResearchNode = mutation({
  args: {
    userId: v.id("users"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const content = getContentById(args.nodeId);

    if (!content || content.unlockCostRP === undefined) {
      throw new Error("Research node not found");
    }

    // Check if already purchased
    const existing = await ctx.db
      .query("playerResearch")
      .withIndex("by_user_node", (q) =>
        q.eq("userId", args.userId).eq("nodeId", args.nodeId)
      )
      .first();

    if (existing) {
      throw new Error("Research already completed");
    }

    // Get lab
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!lab) {
      throw new Error("Lab not found");
    }

    // Check if already researching
    const existingTask = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", lab._id).eq("status", "in_progress")
      )
      .collect();

    const alreadyResearching = existingTask.find((t) => t.type === args.nodeId);
    if (alreadyResearching) {
      throw new Error("Research already in progress");
    }

    // Get player state to check level
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) {
      throw new Error("Player state not found");
    }

    if (playerState.level < (content.minLevel ?? 1)) {
      throw new Error(`Requires level ${content.minLevel}`);
    }

    // Check prerequisites
    const playerUnlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    const unlockedIds = playerUnlocks.unlockedContentIds || [];

    if (content.prerequisite) {
      const prereqId = content.prerequisite;
      const prereqContent = getContentById(prereqId);
      if (prereqContent && !isContentAlreadyUnlocked(prereqContent, unlockedIds)) {
        const purchased = await ctx.db
          .query("playerResearch")
          .withIndex("by_user_node", (q) =>
            q.eq("userId", args.userId).eq("nodeId", prereqId)
          )
          .first();

        if (!purchased) {
          throw new Error(`Requires prerequisite research: ${prereqContent.name}`);
        }
      }
    }

    // Get lab state to check RP
    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", lab._id))
      .first();

    if (!labState) {
      throw new Error("Lab state not found");
    }

    // Calculate money multiplier for RP discount
    const founderBonuses = FOUNDER_BONUSES[lab.founderType as FounderType];
    const moneyMultiplierRank = playerState?.moneyMultiplierRank ?? 0;
    const upMoneyBonus = getUpgradeValue("moneyMultiplier", moneyMultiplierRank) - 100;

    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", lab._id).eq("status", "in_progress")
      )
      .collect();

    let hireMoneyBonus = 0;
    for (const task of activeTasks) {
      const hireContent = getContentById(task.type);
      if (hireContent?.contentType === "hire" && hireContent.hireStat === "moneyMultiplier") {
        hireMoneyBonus += hireContent.hireBonus ?? 0;
      }
    }

    const baseMultiplier = 100;
    const founderMoneyBonus = founderBonuses.moneyMultiplier ?? 0;
    const rpMoneyBonus = (labState.moneyMultiplier ?? 1.0) > 1 ? ((labState.moneyMultiplier ?? 1.0) - 1) * 100 : 0;
    const totalMoneyMultiplier = (baseMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus) / 100;

    const effectiveRPCost = Math.floor(content.unlockCostRP / totalMoneyMultiplier);

    if (labState.researchPoints < effectiveRPCost) {
      throw new Error("Not enough Research Points");
    }

    // Deduct RP
    await ctx.db.patch(labState._id, {
      researchPoints: labState.researchPoints - effectiveRPCost,
    });

    // Calculate duration with speed bonus
    let duration = content.unlockDurationMs ?? 60000;
    const speedBonus = labState.speedBonus || 0;
    if (speedBonus > 0) {
      duration = duration / (1 + speedBonus / 100);
    }

    // Create task
    const effectiveNow = await getEffectiveNow(ctx, args.userId);
    const effectiveCompletesAt = effectiveNow + duration;

    const taskId = await ctx.db.insert("tasks", {
      labId: lab._id,
      type: args.nodeId,
      status: "in_progress",
      startedAt: effectiveNow,
      completesAt: effectiveCompletesAt,
      createdAt: Date.now(),
    });

    // Schedule completion
    const realCompletesAt = await getRealTimeForEffective(ctx, args.userId, effectiveCompletesAt);
    await ctx.scheduler.runAt(realCompletesAt, internal.tasks.completeTask, {
      taskId,
    });

    return {
      taskId,
      status: "in_progress",
      completesAt: effectiveCompletesAt,
      nodeId: args.nodeId,
    };
  },
});

// Get research tree state for a player
export const getResearchTreeState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const purchased = await ctx.db
      .query("playerResearch")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const labState = lab
      ? await ctx.db
          .query("labState")
          .withIndex("by_lab", (q) => q.eq("labId", lab._id))
          .first()
      : null;

    // Get active research tasks
    const activeTasks = lab
      ? await ctx.db
          .query("tasks")
          .withIndex("by_lab_status", (q) =>
            q.eq("labId", lab._id).eq("status", "in_progress")
          )
          .collect()
      : [];

    // Build map of content ID -> active task
    const activeResearchMap = new Map<string, typeof activeTasks[0]>();
    for (const task of activeTasks) {
      const content = getContentById(task.type);
      if (content && content.unlockCostRP !== undefined) {
        activeResearchMap.set(task.type, task);
      }
    }

    const effectiveNow = await getEffectiveNow(ctx, args.userId);

    const playerUnlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    const unlockedIds = playerUnlocks.unlockedContentIds || [];

    const purchasedIds = new Set(purchased.map((p) => p.nodeId));
    const playerLevel = playerState?.level || 1;
    const currentRP = labState?.researchPoints || 0;

    const nodesWithState = ALL_UNLOCKABLES.map((content) => {
      const activeTask = activeResearchMap.get(content.id);
      const isResearching = !!activeTask;

      const isPurchased = purchasedIds.has(content.id) || isContentAlreadyUnlocked(content, unlockedIds);
      const meetsLevel = playerLevel >= (content.minLevel ?? 1);
      
      let meetsPrereqs = true;
      if (content.prerequisite) {
        const prereqContent = getContentById(content.prerequisite);
        meetsPrereqs = prereqContent 
          ? purchasedIds.has(content.prerequisite) || isContentAlreadyUnlocked(prereqContent, unlockedIds)
          : true;
      }
      
      const canAfford = currentRP >= (content.unlockCostRP ?? 0);

      let lockReason: string | undefined;
      if (!meetsLevel) {
        lockReason = `Requires level ${content.minLevel}`;
      } else if (!meetsPrereqs) {
        const prereqContent = getContentById(content.prerequisite!);
        lockReason = `Requires: ${prereqContent?.name || content.prerequisite}`;
      } else if (!canAfford && !isPurchased && !isResearching) {
        lockReason = `Need ${content.unlockCostRP} RP`;
      }

      return {
        nodeId: content.id,
        category: getResearchCategory(content),
        name: content.name,
        description: content.description,
        rpCost: content.unlockCostRP ?? 0,
        durationMs: content.unlockDurationMs ?? 60000,
        minLevel: content.minLevel ?? 1,
        prerequisiteNodes: content.prerequisite ? [content.prerequisite] : [],
        // Status flags
        isPurchased,
        isResearching,
        isAvailable: !isPurchased && !isResearching && meetsLevel && meetsPrereqs && canAfford,
        isLocked: !isPurchased && !isResearching && (!meetsLevel || !meetsPrereqs),
        lockReason,
        // Active task info
        startedAt: activeTask?.startedAt,
        completesAt: activeTask?.completesAt,
      };
    });

    return {
      nodes: nodesWithState,
      effectiveNow,
    };
  },
});

// Complete research node (internal)
export const completeResearchNode = internalMutation({
  args: {
    userId: v.id("users"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const content = getContentById(args.nodeId);
    if (!content) {
      throw new Error("Research node not found");
    }

    // Check if already purchased
    const existing = await ctx.db
      .query("playerResearch")
      .withIndex("by_user_node", (q) =>
        q.eq("userId", args.userId).eq("nodeId", args.nodeId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyCompleted: true };
    }

    // Get lab for updates
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!lab) {
      throw new Error("Lab not found");
    }

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", lab._id))
      .first();

    if (!labState) {
      throw new Error("Lab state not found");
    }

    // Get or create player unlocks
    const unlocks = await getOrCreatePlayerUnlocks(ctx, args.userId);

    // Add content ID to unlocked list
    const currentIds = unlocks.unlockedContentIds || [];
    if (!currentIds.includes(args.nodeId)) {
      await ctx.db.patch(unlocks._id, {
        unlockedContentIds: [...currentIds, args.nodeId],
      });
    }

    // Check for first research milestone
    const purchasedCount = await ctx.db
      .query("playerResearch")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (purchasedCount.length === 0) {
      const milestoneEvent = INBOX_EVENTS.find((e) => e.trigger === "first_research");
      if (milestoneEvent) {
        const existingEvent = await ctx.db
          .query("notifications")
          .withIndex("by_user_event", (q) =>
            q.eq("userId", args.userId).eq("eventId", milestoneEvent.eventId)
          )
          .first();

        if (!existingEvent) {
          await ctx.db.insert("notifications", {
            userId: args.userId,
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

    // Record purchase
    await ctx.db.insert("playerResearch", {
      userId: args.userId,
      nodeId: args.nodeId,
      purchasedAt: Date.now(),
    });

    // Create completion notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "research_complete",
      title: `Research Complete: ${content.name}`,
      message: content.description,
      read: false,
      createdAt: Date.now(),
      deepLink: {
        view: "research",
        target: getResearchCategory(content) || undefined,
      },
    });

    return { success: true, nodeId: args.nodeId };
  },
});
