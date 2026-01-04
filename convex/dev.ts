import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

// =============================================================================
// DEV TOOLS - Reset game state for testing
// =============================================================================

// Reset all game data for a user (keeps user, deletes everything else)
export const resetGameState = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const results = {
      deletedLabs: 0,
      deletedLabStates: 0,
      deletedPlayerStates: 0,
      deletedPlayerUnlocks: 0,
      deletedPlayerResearch: 0,
      deletedTasks: 0,
      deletedModels: 0,
      deletedNotifications: 0,
      deletedCooldowns: 0,
    };

    // Get all labs for this user
    const labs = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const lab of labs) {
      // Delete lab state
      const labState = await ctx.db
        .query("labState")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .first();
      if (labState) {
        await ctx.db.delete(labState._id);
        results.deletedLabStates++;
      }

      // Delete all tasks for this lab
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
        results.deletedTasks++;
      }

      // Delete all trained models for this lab
      const models = await ctx.db
        .query("trainedModels")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const model of models) {
        await ctx.db.delete(model._id);
        results.deletedModels++;
      }

      // Delete freelance cooldowns
      const cooldowns = await ctx.db
        .query("freelanceCooldowns")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const cooldown of cooldowns) {
        await ctx.db.delete(cooldown._id);
        results.deletedCooldowns++;
      }

      // Delete the lab itself
      await ctx.db.delete(lab._id);
      results.deletedLabs++;
    }

    // Delete player state
    const playerStates = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const ps of playerStates) {
      await ctx.db.delete(ps._id);
      results.deletedPlayerStates++;
    }

    // Delete player unlocks
    const playerUnlocks = await ctx.db
      .query("playerUnlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const pu of playerUnlocks) {
      await ctx.db.delete(pu._id);
      results.deletedPlayerUnlocks++;
    }

    // Delete player research
    const playerResearch = await ctx.db
      .query("playerResearch")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const pr of playerResearch) {
      await ctx.db.delete(pr._id);
      results.deletedPlayerResearch++;
    }

    // Delete notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
      results.deletedNotifications++;
    }

    return {
      success: true,
      message: "Game state reset. Create a new lab to start fresh!",
      ...results,
    };
  },
});

// Reset game state by email (convenience wrapper)
export const resetGameStateByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`);
    }

    // Call the main reset function
    const results = {
      deletedLabs: 0,
      deletedLabStates: 0,
      deletedPlayerStates: 0,
      deletedPlayerUnlocks: 0,
      deletedPlayerResearch: 0,
      deletedTasks: 0,
      deletedModels: 0,
      deletedNotifications: 0,
      deletedCooldowns: 0,
    };

    // Get all labs for this user
    const labs = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const lab of labs) {
      const labState = await ctx.db
        .query("labState")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .first();
      if (labState) {
        await ctx.db.delete(labState._id);
        results.deletedLabStates++;
      }

      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
        results.deletedTasks++;
      }

      const models = await ctx.db
        .query("trainedModels")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const model of models) {
        await ctx.db.delete(model._id);
        results.deletedModels++;
      }

      const cooldowns = await ctx.db
        .query("freelanceCooldowns")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const cooldown of cooldowns) {
        await ctx.db.delete(cooldown._id);
        results.deletedCooldowns++;
      }

      await ctx.db.delete(lab._id);
      results.deletedLabs++;
    }

    const playerStates = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const ps of playerStates) {
      await ctx.db.delete(ps._id);
      results.deletedPlayerStates++;
    }

    const playerUnlocks = await ctx.db
      .query("playerUnlocks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const pu of playerUnlocks) {
      await ctx.db.delete(pu._id);
      results.deletedPlayerUnlocks++;
    }

    const playerResearch = await ctx.db
      .query("playerResearch")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const pr of playerResearch) {
      await ctx.db.delete(pr._id);
      results.deletedPlayerResearch++;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
      results.deletedNotifications++;
    }

    return {
      success: true,
      userId: user._id,
      email: args.email,
      message: "Game state reset. Create a new lab to start fresh!",
      ...results,
    };
  },
});

// Nuclear option: Delete ALL game data (keeps users only)
export const resetAllGameData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      deletedLabs: 0,
      deletedLabStates: 0,
      deletedPlayerStates: 0,
      deletedPlayerUnlocks: 0,
      deletedPlayerResearch: 0,
      deletedTasks: 0,
      deletedModels: 0,
      deletedNotifications: 0,
      deletedCooldowns: 0,
    };

    // Delete all labs
    const labs = await ctx.db.query("labs").collect();
    for (const lab of labs) {
      await ctx.db.delete(lab._id);
      results.deletedLabs++;
    }

    // Delete all lab states
    const labStates = await ctx.db.query("labState").collect();
    for (const ls of labStates) {
      await ctx.db.delete(ls._id);
      results.deletedLabStates++;
    }

    // Delete all player states
    const playerStates = await ctx.db.query("playerState").collect();
    for (const ps of playerStates) {
      await ctx.db.delete(ps._id);
      results.deletedPlayerStates++;
    }

    // Delete all player unlocks
    const playerUnlocks = await ctx.db.query("playerUnlocks").collect();
    for (const pu of playerUnlocks) {
      await ctx.db.delete(pu._id);
      results.deletedPlayerUnlocks++;
    }

    // Delete all player research
    const playerResearch = await ctx.db.query("playerResearch").collect();
    for (const pr of playerResearch) {
      await ctx.db.delete(pr._id);
      results.deletedPlayerResearch++;
    }

    // Delete all tasks
    const tasks = await ctx.db.query("tasks").collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
      results.deletedTasks++;
    }

    // Delete all trained models
    const models = await ctx.db.query("trainedModels").collect();
    for (const model of models) {
      await ctx.db.delete(model._id);
      results.deletedModels++;
    }

    // Delete all notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
      results.deletedNotifications++;
    }

    // Delete all cooldowns
    const cooldowns = await ctx.db.query("freelanceCooldowns").collect();
    for (const cd of cooldowns) {
      await ctx.db.delete(cd._id);
      results.deletedCooldowns++;
    }

    return {
      success: true,
      message: "All game data deleted. Users preserved.",
      ...results,
    };
  },
});

