import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// TIME WARP - Dev-only time acceleration (007_dev_time_warp)
// =============================================================================

// Allowed time scales
const ALLOWED_TIME_SCALES = [1, 5, 20, 100] as const;
type TimeScale = (typeof ALLOWED_TIME_SCALES)[number];

// Check if a user is a dev admin (server-side check)
export async function isDevAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  try {
    // Get user email
    const user = await ctx.db.get(userId);
    if (!user?.email) return false;

    // Check allowlist from env (gracefully handle missing env var)
    const allowlist = process.env.DEV_ADMIN_USER_EMAILS;
    if (!allowlist) return false;
    
    const allowedEmails = allowlist
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return allowedEmails.includes(user.email.toLowerCase());
  } catch {
    // If anything fails (e.g., env not set), return false
    return false;
  }
}

// Get user's time scale (returns 1 for non-dev users)
export async function getTimeScale(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<number> {
  const isDev = await isDevAdmin(ctx, userId);
  if (!isDev) return 1;

  const settings = await ctx.db
    .query("devUserSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return settings?.timeScale ?? 1;
}

// Get effective "now" for a user (accounts for Time Warp)
export async function getEffectiveNow(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<number> {
  const realNow = Date.now();

  const isDev = await isDevAdmin(ctx, userId);
  if (!isDev) return realNow;

  const settings = await ctx.db
    .query("devUserSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!settings || settings.timeScale === 1) return realNow;
  if (
    settings.warpEnabledAtRealMs == null ||
    settings.warpEnabledAtEffectiveMs == null
  )
    return realNow;

  // effectiveNow = warpEnabledAtEffectiveMs + (realNow - warpEnabledAtRealMs) * timeScale
  const elapsed = realNow - settings.warpEnabledAtRealMs;
  return settings.warpEnabledAtEffectiveMs + elapsed * settings.timeScale;
}

// Calculate when in real time an effective time will be reached
export async function getRealTimeForEffective(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  targetEffectiveTime: number
): Promise<number> {
  const realNow = Date.now();

  const isDev = await isDevAdmin(ctx, userId);
  if (!isDev) return targetEffectiveTime;

  const settings = await ctx.db
    .query("devUserSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!settings || settings.timeScale === 1) return targetEffectiveTime;
  if (
    settings.warpEnabledAtRealMs == null ||
    settings.warpEnabledAtEffectiveMs == null
  )
    return targetEffectiveTime;

  // We want to find realTarget such that:
  // warpEnabledAtEffectiveMs + (realTarget - warpEnabledAtRealMs) * timeScale = targetEffectiveTime
  // (realTarget - warpEnabledAtRealMs) = (targetEffectiveTime - warpEnabledAtEffectiveMs) / timeScale
  // realTarget = warpEnabledAtRealMs + (targetEffectiveTime - warpEnabledAtEffectiveMs) / timeScale
  const effectiveDelta =
    targetEffectiveTime - settings.warpEnabledAtEffectiveMs;
  const realTarget =
    settings.warpEnabledAtRealMs + effectiveDelta / settings.timeScale;

  // If target is in the past, return now
  return Math.max(realTarget, realNow);
}

// Query: Check if user is a dev admin (simple boolean check)
export const checkIsAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      return await isDevAdmin(ctx, args.userId);
    } catch {
      // Gracefully return false if anything fails
      return false;
    }
  },
});

// Query: Get dev settings for current user
export const getDevSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allowed = await isDevAdmin(ctx, args.userId);

    if (!allowed) {
      return { allowed: false, timeScale: 1 };
    }

    const settings = await ctx.db
      .query("devUserSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return {
      allowed: true,
      timeScale: settings?.timeScale ?? 1,
    };
  },
});

// Mutation: Set time scale (dev-only)
export const setTimeScale = mutation({
  args: {
    userId: v.id("users"),
    timeScale: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate dev admin
    const allowed = await isDevAdmin(ctx, args.userId);
    if (!allowed) {
      throw new Error("Not authorized to use Time Warp");
    }

    // Validate time scale
    if (!ALLOWED_TIME_SCALES.includes(args.timeScale as TimeScale)) {
      throw new Error(
        `Invalid time scale. Allowed: ${ALLOWED_TIME_SCALES.join(", ")}`
      );
    }

    const realNow = Date.now();

    // Get current settings
    const existing = await ctx.db
      .query("devUserSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const currentScale = existing?.timeScale ?? 1;
    const newScale = args.timeScale;

    // Calculate new baselines
    let warpEnabledAtRealMs: number | undefined;
    let warpEnabledAtEffectiveMs: number | undefined;

    if (newScale === 1) {
      // Switching to 1x: clear baselines
      warpEnabledAtRealMs = undefined;
      warpEnabledAtEffectiveMs = undefined;
    } else if (currentScale === 1) {
      // Switching from 1x to Nx: set baselines to now
      warpEnabledAtRealMs = realNow;
      warpEnabledAtEffectiveMs = realNow;
    } else {
      // Switching from Nx to Mx: compute current effectiveNow, then reset baselines
      const currentEffectiveNow = await getEffectiveNow(ctx, args.userId);
      warpEnabledAtRealMs = realNow;
      warpEnabledAtEffectiveMs = currentEffectiveNow;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        timeScale: newScale,
        warpEnabledAtRealMs,
        warpEnabledAtEffectiveMs,
        updatedAt: realNow,
      });
    } else {
      await ctx.db.insert("devUserSettings", {
        userId: args.userId,
        timeScale: newScale,
        warpEnabledAtRealMs,
        warpEnabledAtEffectiveMs,
        updatedAt: realNow,
      });
    }

    return { success: true, timeScale: newScale };
  },
});

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
      deletedLeaderboardEntries: 0,
      deletedBestModels: 0,
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

      // Delete leaderboard entries
      const leaderboardEntries = await ctx.db
        .query("worldLeaderboard")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const entry of leaderboardEntries) {
        await ctx.db.delete(entry._id);
        results.deletedLeaderboardEntries++;
      }

      // Delete best models entries
      const bestModels = await ctx.db
        .query("worldBestModels")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const entry of bestModels) {
        await ctx.db.delete(entry._id);
        results.deletedBestModels++;
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
      deletedLeaderboardEntries: 0,
      deletedBestModels: 0,
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

      // Delete leaderboard entries
      const leaderboardEntries = await ctx.db
        .query("worldLeaderboard")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const entry of leaderboardEntries) {
        await ctx.db.delete(entry._id);
        results.deletedLeaderboardEntries++;
      }

      // Delete best models entries
      const bestModels = await ctx.db
        .query("worldBestModels")
        .withIndex("by_lab", (q) => q.eq("labId", lab._id))
        .collect();
      for (const entry of bestModels) {
        await ctx.db.delete(entry._id);
        results.deletedBestModels++;
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

// Reset all player progress while keeping users and labs
// - Keeps users and labs intact
// - Resets playerState (level=1, xp=0)
// - Clears all research/unlocks (back to starter defaults)
// - Deletes tasks, trained models, notifications, etc.
export const resetAllPlayerProgress = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      resetPlayerStates: 0,
      clearedPlayerUnlocks: 0,
      clearedPlayerResearch: 0,
      deletedTasks: 0,
      deletedModels: 0,
      deletedNotifications: 0,
      deletedCooldowns: 0,
      deletedLeaderboardEntries: 0,
      deletedBestModels: 0,
      resetLabStates: 0,
    };

    // Reset all player states to level 1, 0 XP, clear upgrade ranks
    const playerStates = await ctx.db.query("playerState").collect();
    for (const ps of playerStates) {
      await ctx.db.patch(ps._id, {
        level: 1,
        experience: 0,
        upgradePoints: 0,
        queueRank: 0,
        staffRank: 0,
        computeRank: 0,
        speedRank: 0,
        moneyMultiplierRank: 0,
      });
      results.resetPlayerStates++;
    }

    // Reset all lab states (cash back to 0, RP back to 0, clear bonuses)
    const labStates = await ctx.db.query("labState").collect();
    for (const ls of labStates) {
      await ctx.db.patch(ls._id, {
        cash: 0,
        researchPoints: 0,
        juniorResearchers: 0,
        speedBonus: 0,
        moneyMultiplier: 1,
      });
      results.resetLabStates++;
    }

    // Delete all player unlocks (will be recreated with starter defaults)
    const playerUnlocks = await ctx.db.query("playerUnlocks").collect();
    for (const pu of playerUnlocks) {
      await ctx.db.delete(pu._id);
      results.clearedPlayerUnlocks++;
    }

    // Delete all player research (will be recreated with starter defaults)
    const playerResearch = await ctx.db.query("playerResearch").collect();
    for (const pr of playerResearch) {
      await ctx.db.delete(pr._id);
      results.clearedPlayerResearch++;
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

    // Delete all leaderboard entries
    const leaderboardEntries = await ctx.db.query("worldLeaderboard").collect();
    for (const entry of leaderboardEntries) {
      await ctx.db.delete(entry._id);
      results.deletedLeaderboardEntries++;
    }

    // Delete all best models entries
    const bestModels = await ctx.db.query("worldBestModels").collect();
    for (const entry of bestModels) {
      await ctx.db.delete(entry._id);
      results.deletedBestModels++;
    }

    return {
      success: true,
      message: "All player progress reset to level 1. Users and labs preserved. Starter unlocks will be recreated on next login.",
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
      deletedLeaderboardEntries: 0,
      deletedBestModels: 0,
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

    // Delete all leaderboard entries
    const leaderboardEntries = await ctx.db.query("worldLeaderboard").collect();
    for (const entry of leaderboardEntries) {
      await ctx.db.delete(entry._id);
      results.deletedLeaderboardEntries++;
    }

    // Delete all best models entries
    const bestModels = await ctx.db.query("worldBestModels").collect();
    for (const entry of bestModels) {
      await ctx.db.delete(entry._id);
      results.deletedBestModels++;
    }

    return {
      success: true,
      message: "All game data deleted. Users preserved.",
      ...results,
    };
  },
});
