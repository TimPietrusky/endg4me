import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { RESEARCH_NODES, getResearchNodeById, INBOX_EVENTS, getJobById } from "./lib/contentCatalog";
import { FOUNDER_BONUSES, getUpgradeValue, type FounderType } from "./lib/gameConfig";
import { internal } from "./_generated/api";
import { getEffectiveNow, getRealTimeForEffective } from "./dev";

// All research nodes come directly from contentCatalog - NO DATABASE SEEDING NEEDED
// Just edit contentCatalog.ts and changes take effect immediately
const ALL_NODES = RESEARCH_NODES;

// Get all research nodes (from config, not database)
export const getResearchNodes = query({
  args: {},
  handler: async () => {
    return ALL_NODES;
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

// Get starter unlocks (for new players)
function getStarterUnlocks() {
  const starterBlueprintIds: string[] = [];
  const starterJobIds: string[] = ["job_research_literature"]; // Always available
  const starterFlags: string[] = [];

  // Auto-unlock free research nodes
  for (const node of ALL_NODES) {
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
    // Return defaults without creating a record (for queries)
    return { _id: null, userId, ...getStarterUnlocks() };
  }

  return unlocks;
}

// Get or create player unlocks record (for mutations only)
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

// Check if a specific job is unlocked
export const isJobUnlocked = query({
  args: { userId: v.id("users"), jobId: v.string() },
  handler: async (ctx, args) => {
    const unlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    return unlocks?.unlockedJobIds?.includes(args.jobId) ?? false;
  },
});

// Check if a specific blueprint is unlocked
export const isBlueprintUnlocked = query({
  args: { userId: v.id("users"), blueprintId: v.string() },
  handler: async (ctx, args) => {
    const unlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    return unlocks?.unlockedBlueprintIds?.includes(args.blueprintId) ?? false;
  },
});

// Helper to check if a node's unlocks are already owned (starter items)
function isNodeAlreadyUnlocked(
  node: typeof RESEARCH_NODES[0],
  playerUnlocks: { unlockedBlueprintIds?: string[]; unlockedJobIds?: string[]; enabledSystemFlags?: string[] }
): boolean {
  // Check if all blueprint unlocks are already owned
  if (node.unlocks.unlocksBlueprintIds?.length) {
    const allBlueprintsOwned = node.unlocks.unlocksBlueprintIds.every(
      (bpId) => playerUnlocks.unlockedBlueprintIds?.includes(bpId)
    );
    if (allBlueprintsOwned) return true;
  }
  // Check if all job unlocks are already owned
  if (node.unlocks.unlocksJobIds?.length) {
    const allJobsOwned = node.unlocks.unlocksJobIds.every(
      (jobId) => playerUnlocks.unlockedJobIds?.includes(jobId)
    );
    if (allJobsOwned) return true;
  }
  // Check if all system flags are already owned
  if (node.unlocks.enablesSystemFlags?.length) {
    const allFlagsOwned = node.unlocks.enablesSystemFlags.every(
      (flag) => playerUnlocks.enabledSystemFlags?.includes(flag)
    );
    if (allFlagsOwned) return true;
  }
  return false;
}

// Check if a system flag is enabled
export const isSystemFlagEnabled = query({
  args: { userId: v.id("users"), flag: v.string() },
  handler: async (ctx, args) => {
    const unlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    return unlocks?.enabledSystemFlags?.includes(args.flag) ?? false;
  },
});

// Start researching a node (creates a timed task - same system as jobs)
export const purchaseResearchNode = mutation({
  args: {
    userId: v.id("users"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the research node FROM CONFIG (not database)
    const node = getResearchNodeById(args.nodeId);

    if (!node) {
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

    // Check if already researching (task in progress)
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!lab) {
      throw new Error("Lab not found");
    }

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

    if (playerState.level < node.minLevel) {
      throw new Error(`Requires level ${node.minLevel}`);
    }

    // Check prerequisites
    const playerUnlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);
    
    for (const prereqId of node.prerequisiteNodes) {
      const hasPrereq = await ctx.db
        .query("playerResearch")
        .withIndex("by_user_node", (q) =>
          q.eq("userId", args.userId).eq("nodeId", prereqId)
        )
        .first();

      if (!hasPrereq) {
        const prereqNode = getResearchNodeById(prereqId);
        const isStarterUnlocked = prereqNode && isNodeAlreadyUnlocked(prereqNode, playerUnlocks);
        
        if (!isStarterUnlocked) {
          throw new Error(`Requires prerequisite research: ${prereqNode?.name || prereqId}`);
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

    // Calculate total money multiplier from all sources
    const founderBonuses = FOUNDER_BONUSES[lab.founderType as FounderType];
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    // UP rank bonus for money multiplier
    const moneyMultiplierRank = playerState?.moneyMultiplierRank ?? 0;
    const upMoneyBonus = getUpgradeValue("moneyMultiplier", moneyMultiplierRank) - 100;
    
    // Active hire bonuses for money multiplier
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", lab._id).eq("status", "in_progress")
      )
      .collect();
    
    let hireMoneyBonus = 0;
    for (const task of activeTasks) {
      const hireJobDef = getJobById(task.type);
      if (hireJobDef?.category === "hire" && hireJobDef.output.hireStat === "moneyMultiplier") {
        hireMoneyBonus += hireJobDef.output.hireBonus ?? 0;
      }
    }
    
    // Total: base 100% + founder + UP + RP perks + hires
    const baseMultiplier = 100;
    const founderMoneyBonus = founderBonuses.moneyMultiplier ?? 0;
    const rpMoneyBonus = (labState.moneyMultiplier ?? 1.0) > 1 ? ((labState.moneyMultiplier ?? 1.0) - 1) * 100 : 0;
    const totalMoneyMultiplier = (baseMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus) / 100;
    
    // Calculate effective RP cost (higher multiplier = lower cost)
    const effectiveRPCost = Math.floor(node.costRP / totalMoneyMultiplier);

    if (labState.researchPoints < effectiveRPCost) {
      throw new Error("Not enough Research Points");
    }

    // Deduct RP immediately (with money multiplier applied)
    await ctx.db.patch(labState._id, {
      researchPoints: labState.researchPoints - effectiveRPCost,
    });

    // Calculate duration (apply speed bonus)
    let duration = node.durationMs;
    const speedBonus = labState.speedBonus || 0;
    if (speedBonus > 0) {
      duration = duration / (1 + speedBonus / 100);
    }

    // Use effective time for Time Warp support
    const effectiveNow = await getEffectiveNow(ctx, args.userId);
    const effectiveCompletesAt = effectiveNow + duration;

    // Create task (same system as jobs)
    const taskId = await ctx.db.insert("tasks", {
      labId: lab._id,
      type: args.nodeId, // Research node ID as task type
      status: "in_progress",
      startedAt: effectiveNow,
      completesAt: effectiveCompletesAt,
      createdAt: Date.now(),
    });

    // Schedule completion at real time (accounting for Time Warp)
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

// Get research tree state for a player (nodes with availability status + active tasks)
export const getResearchTreeState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Nodes come from CONFIG, purchases from DATABASE
    const nodes = ALL_NODES;
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

    // Build map of node ID -> active task
    const activeResearchMap = new Map<string, typeof activeTasks[0]>();
    for (const task of activeTasks) {
      if (task.type.startsWith("rn_")) {
        activeResearchMap.set(task.type, task);
      }
    }

    // Get effective time for progress calculation
    const effectiveNow = await getEffectiveNow(ctx, args.userId);

    // Get player unlocks to check for starter items
    const playerUnlocks = await getPlayerUnlocksOrDefaults(ctx, args.userId);

    const purchasedIds = new Set(purchased.map((p) => p.nodeId));
    const playerLevel = playerState?.level || 1;
    const currentRP = labState?.researchPoints || 0;

    // Categories come from contentCatalog: model, revenue, perk, hiring

    const nodesWithState = nodes.map((node) => {
      // Check if this node is actively being researched
      const activeTask = activeResearchMap.get(node.nodeId);
      const isResearching = !!activeTask;

      // Node is purchased if: explicit purchase record OR unlocks already owned (starter items)
      const isPurchased = purchasedIds.has(node.nodeId) || isNodeAlreadyUnlocked(node, playerUnlocks);
      const meetsLevel = playerLevel >= node.minLevel;
      const meetsPrereqs = node.prerequisiteNodes.every((prereq) =>
        purchasedIds.has(prereq) || isNodeAlreadyUnlocked(nodes.find(n => n.nodeId === prereq)!, playerUnlocks)
      );
      const canAfford = currentRP >= node.costRP;

      let lockReason: string | undefined;
      if (!meetsLevel) {
        lockReason = `Requires level ${node.minLevel}`;
      } else if (!meetsPrereqs) {
        const missingPrereq = node.prerequisiteNodes.find(
          (prereq) => !purchasedIds.has(prereq) && !isNodeAlreadyUnlocked(nodes.find(n => n.nodeId === prereq)!, playerUnlocks)
        );
        const prereqNode = getResearchNodeById(missingPrereq || "");
        lockReason = `Requires: ${prereqNode?.name || missingPrereq}`;
      } else if (!canAfford && !isPurchased && !isResearching) {
        lockReason = `Need ${node.costRP} RP`;
      }

      return {
        ...node,
        // Category from contentCatalog (model, revenue, perk, hiring)
        category: node.category,
        // Flatten unlocks for easier UI access
        rpCost: node.costRP,
        unlockType: node.category,
        unlockTarget: node.unlocks.unlocksBlueprintIds?.[0] ||
                      node.unlocks.unlocksJobIds?.[0] ||
                      node.unlocks.enablesSystemFlags?.[0] ||
                      node.unlocks.perkType ||
                      node.nodeId,
        unlockDescription: getUnlockDescription(node),
        perkType: node.unlocks.perkType,
        perkValue: node.unlocks.perkValue,
        // Status flags
        isPurchased,
        isResearching,
        isAvailable: !isPurchased && !isResearching && meetsLevel && meetsPrereqs && canAfford,
        isLocked: !isPurchased && !isResearching && (!meetsLevel || !meetsPrereqs),
        lockReason,
        // Active task info (for progress bar)
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

// Helper to generate unlock description
function getUnlockDescription(node: typeof RESEARCH_NODES[0]): string {
  if (node.unlocks.unlocksBlueprintIds?.length) {
    return `Unlock training: ${node.unlocks.unlocksBlueprintIds.join(", ")}`;
  }
  if (node.unlocks.unlocksJobIds?.length) {
    return `Unlock job: ${node.unlocks.unlocksJobIds.join(", ")}`;
  }
  if (node.unlocks.enablesSystemFlags?.length) {
    return `Enable: ${node.unlocks.enablesSystemFlags.join(", ")}`;
  }
  if (node.unlocks.perkType === "speed") {
    return `+${node.unlocks.perkValue}% speed`;
  }
  if (node.unlocks.perkType === "money_multiplier") {
    return `+${(node.unlocks.perkValue || 0) * 100}% income`;
  }
  return node.description;
}

// Internal mutation called by tasks.ts when a research task completes
export const completeResearchNode = internalMutation({
  args: {
    userId: v.id("users"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const node = getResearchNodeById(args.nodeId);
    if (!node) {
      throw new Error("Research node not found");
    }

    // Check if already purchased (race condition guard)
    const existing = await ctx.db
      .query("playerResearch")
      .withIndex("by_user_node", (q) =>
        q.eq("userId", args.userId).eq("nodeId", args.nodeId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyCompleted: true };
    }

    // Get lab for perk updates
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

    // Apply unlock outputs based on node type
    const updates: {
      unlockedBlueprintIds?: string[];
      unlockedJobIds?: string[];
      enabledSystemFlags?: string[];
    } = {};

    // Unlock blueprints
    if (node.unlocks.unlocksBlueprintIds && node.unlocks.unlocksBlueprintIds.length > 0) {
      const currentBlueprints = unlocks.unlockedBlueprintIds || [];
      const newBlueprints = node.unlocks.unlocksBlueprintIds.filter(
        (id: string) => !currentBlueprints.includes(id)
      );
      if (newBlueprints.length > 0) {
        updates.unlockedBlueprintIds = [...currentBlueprints, ...newBlueprints];
      }
    }

    // Unlock jobs
    if (node.unlocks.unlocksJobIds && node.unlocks.unlocksJobIds.length > 0) {
      const currentJobs = unlocks.unlockedJobIds || [];
      const newJobs = node.unlocks.unlocksJobIds.filter(
        (id: string) => !currentJobs.includes(id)
      );
      if (newJobs.length > 0) {
        updates.unlockedJobIds = [...currentJobs, ...newJobs];
      }
    }

    // Enable system flags
    if (node.unlocks.enablesSystemFlags && node.unlocks.enablesSystemFlags.length > 0) {
      const currentFlags = unlocks.enabledSystemFlags || [];
      const newFlags = node.unlocks.enablesSystemFlags.filter(
        (flag: string) => !currentFlags.includes(flag)
      );
      if (newFlags.length > 0) {
        updates.enabledSystemFlags = [...currentFlags, ...newFlags];
      }
    }

    // Apply perk bonuses
    if (node.category === "perk" && node.unlocks.perkType && node.unlocks.perkValue !== undefined) {
      const labUpdates: Record<string, number> = {};
      switch (node.unlocks.perkType) {
        case "speed":
          labUpdates.speedBonus = (labState.speedBonus || 0) + node.unlocks.perkValue;
          break;
        case "money_multiplier":
          labUpdates.moneyMultiplier = (labState.moneyMultiplier || 1.0) + node.unlocks.perkValue;
          break;
      }
      if (Object.keys(labUpdates).length > 0) {
        await ctx.db.patch(labState._id, labUpdates);
      }
    }

    // Update player unlocks if there are changes
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(unlocks._id, updates);
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
      title: `Research Complete: ${node.name}`,
      message: getUnlockDescription(node),
      read: false,
      createdAt: Date.now(),
      deepLink: {
        view: "research",
        target: node.category,
      },
    });

    return { success: true, nodeId: args.nodeId };
  },
});
