import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PERK_NODES } from "./lib/skillTree";

// All research nodes come directly from config - NO DATABASE SEEDING NEEDED
// Just edit skillTree.ts and changes take effect immediately
// NOTE: Queue/Staff/Compute have moved to UP system (lab → upgrades)
// This now only handles RP perks (research_speed, money_multiplier)
const ALL_NODES = PERK_NODES;

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

// Helper to get node from config
function getNodeFromConfig(nodeId: string) {
  return ALL_NODES.find((n) => n.nodeId === nodeId);
}

// Purchase a research node
export const purchaseResearchNode = mutation({
  args: {
    userId: v.id("users"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the research node FROM CONFIG (not database)
    const node = getNodeFromConfig(args.nodeId);

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
      throw new Error("Research node already purchased");
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
    for (const prereqId of node.prerequisiteNodes) {
      const hasPrereq = await ctx.db
        .query("playerResearch")
        .withIndex("by_user_node", (q) =>
          q.eq("userId", args.userId).eq("nodeId", prereqId)
        )
        .first();

      if (!hasPrereq) {
        throw new Error(`Requires prerequisite research: ${prereqId}`);
      }
    }

    // Get lab state to check RP
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

    if (labState.researchPoints < node.rpCost) {
      throw new Error("Not enough Research Points");
    }

    // Deduct RP
    await ctx.db.patch(labState._id, {
      researchPoints: labState.researchPoints - node.rpCost,
    });

    // Apply perk upgrades
    if (node.unlockType === "perk" && node.perkType && node.perkValue !== undefined) {
      const updates: Record<string, number> = {};
      switch (node.perkType) {
        case "research_speed":
          updates.researchSpeedBonus = (labState.researchSpeedBonus || 0) + node.perkValue;
          break;
        case "money_multiplier":
          // Additive: base 1.0 + bonuses (+0.1 per tier)
          updates.moneyMultiplier = (labState.moneyMultiplier || 1.0) + node.perkValue;
          break;
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(labState._id, updates);
      }
    }

    // Record purchase (only the nodeId, not the full node data)
    await ctx.db.insert("playerResearch", {
      userId: args.userId,
      nodeId: args.nodeId,
      purchasedAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "research_complete",
      title: `Research Complete: ${node.name}`,
      message: node.unlockDescription,
      read: false,
      createdAt: Date.now(),
      deepLink: {
        view: "research",
        target: node.unlockTarget,
      },
    });

    return { success: true, nodeId: args.nodeId };
  },
});

// Get research tree state for a player (nodes with availability status)
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

    const purchasedIds = new Set(purchased.map((p) => p.nodeId));
    const playerLevel = playerState?.level || 1;

    return nodes.map((node) => {
      const isPurchased = purchasedIds.has(node.nodeId);
      const meetsLevel = playerLevel >= node.minLevel;
      const meetsPrereqs = node.prerequisiteNodes.every((prereq) =>
        purchasedIds.has(prereq)
      );

      let lockReason: string | undefined;
      if (!meetsLevel) {
        lockReason = `Requires level ${node.minLevel}`;
      } else if (!meetsPrereqs) {
        const missingPrereq = node.prerequisiteNodes.find(
          (prereq) => !purchasedIds.has(prereq)
        );
        lockReason = `Requires research: ${missingPrereq}`;
      }

      return {
        ...node,
        isPurchased,
        isAvailable: !isPurchased && meetsLevel && meetsPrereqs,
        isLocked: !isPurchased && (!meetsLevel || !meetsPrereqs),
        lockReason,
      };
    });
  },
});
