import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LEVEL_REWARDS } from "./lib/gameConstants";

// Create a clan
export const createClan = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check player level
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) throw new Error("Player not found");
    if (playerState.level < LEVEL_REWARDS.clanUnlockLevel) {
      throw new Error(`Must be level ${LEVEL_REWARDS.clanUnlockLevel} to create a clan`);
    }
    if (playerState.clanId) {
      throw new Error("Already in a clan");
    }

    // Check clan name uniqueness
    const existingClan = await ctx.db
      .query("clans")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingClan) {
      throw new Error("Clan name already taken");
    }

    // Create clan
    const clanId = await ctx.db.insert("clans", {
      name: args.name,
      creatorId: args.userId,
      createdAt: Date.now(),
    });

    // Join the clan
    await ctx.db.patch(playerState._id, {
      clanId,
    });

    return clanId;
  },
});

// Join a clan
export const joinClan = mutation({
  args: {
    userId: v.id("users"),
    clanId: v.id("clans"),
  },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) throw new Error("Player not found");
    if (playerState.level < LEVEL_REWARDS.clanUnlockLevel) {
      throw new Error(`Must be level ${LEVEL_REWARDS.clanUnlockLevel} to join a clan`);
    }
    if (playerState.clanId) {
      throw new Error("Already in a clan");
    }

    const clan = await ctx.db.get(args.clanId);
    if (!clan) throw new Error("Clan not found");

    await ctx.db.patch(playerState._id, {
      clanId: args.clanId,
    });

    return args.clanId;
  },
});

// Leave clan
export const leaveClan = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) throw new Error("Player not found");
    if (!playerState.clanId) throw new Error("Not in a clan");

    await ctx.db.patch(playerState._id, {
      clanId: undefined,
    });
  },
});

// Get clan info
export const getClan = query({
  args: { clanId: v.id("clans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clanId);
  },
});

// Get clan members
export const getClanMembers = query({
  args: { clanId: v.id("clans") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("playerState")
      .filter((q) => q.eq(q.field("clanId"), args.clanId))
      .collect();

    const memberData = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user,
        };
      })
    );

    return memberData;
  },
});

// Get all clans
export const getAllClans = query({
  args: {},
  handler: async (ctx) => {
    const clans = await ctx.db.query("clans").order("desc").take(50);

    // Get member counts and total RP
    const clansWithCounts = await Promise.all(
      clans.map(async (clan) => {
        const members = await ctx.db
          .query("playerState")
          .filter((q) => q.eq(q.field("clanId"), clan._id))
          .collect();

        // Calculate total research points (reputation removed)
        const totalRpValues = await Promise.all(
          members.map(async (m) => {
            const lab = await ctx.db
              .query("labs")
              .withIndex("by_user", (q) => q.eq("userId", m.userId))
              .first();
            if (!lab) return 0;
            const labState = await ctx.db
              .query("labState")
              .withIndex("by_lab", (q) => q.eq("labId", lab._id))
              .first();
            return labState?.researchPoints || 0;
          })
        );

        return {
          ...clan,
          memberCount: members.length,
          totalResearchPoints: totalRpValues.reduce((a: number, b: number) => a + b, 0),
        };
      })
    );

    return clansWithCounts;
  },
});

// Get user's clan
export const getUserClan = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState?.clanId) return null;

    const clan = await ctx.db.get(playerState.clanId);
    if (!clan) return null;

    const members = await ctx.db
      .query("playerState")
      .filter((q) => q.eq(q.field("clanId"), clan._id))
      .collect();

    return {
      ...clan,
      memberCount: members.length,
    };
  },
});

