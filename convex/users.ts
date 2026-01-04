import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { INITIAL_PLAYER_STATE } from "./lib/gameConstants";

// Get or create user from WorkOS auth
export const getOrCreateUser = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (existingUser) {
      // Ensure playerState exists (may have been deleted by reset)
      const existingPlayerState = await ctx.db
        .query("playerState")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .first();
      
      if (!existingPlayerState) {
        await ctx.db.insert("playerState", {
          userId: existingUser._id,
          ...INITIAL_PLAYER_STATE,
        });
      }
      
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      createdAt: Date.now(),
    });

    // Create initial player state
    await ctx.db.insert("playerState", {
      userId,
      ...INITIAL_PLAYER_STATE,
    });

    return userId;
  },
});

// Get current user by WorkOS ID
export const getCurrentUser = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

