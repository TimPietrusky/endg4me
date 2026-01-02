import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { INITIAL_LAB_STATE } from "./lib/gameConstants";

// Create a new lab for user
export const createLab = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    founderType: v.union(v.literal("technical"), v.literal("business")),
  },
  handler: async (ctx, args) => {
    // Check if user already has a lab
    const existingLab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingLab) {
      throw new Error("User already has a lab");
    }

    // Create the lab
    const labId = await ctx.db.insert("labs", {
      userId: args.userId,
      name: args.name,
      founderType: args.founderType,
      createdAt: Date.now(),
    });

    // Create initial lab state
    await ctx.db.insert("labState", {
      labId,
      ...INITIAL_LAB_STATE,
    });

    return labId;
  },
});

// Get user's lab
export const getUserLab = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get lab by ID
export const getLab = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.labId);
  },
});

// Get lab state
export const getLabState = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();
  },
});

// Get full lab data (lab + state)
export const getFullLabData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!lab) return null;

    const labState = await ctx.db
      .query("labState")
      .withIndex("by_lab", (q) => q.eq("labId", lab._id))
      .first();

    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return {
      lab,
      labState,
      playerState,
    };
  },
});

