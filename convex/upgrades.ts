import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  LAB_UPGRADES,
  getUpgradeValue,
  getRequiredLevelForRank,
  isRankUnlocked,
  type UpgradeType,
} from "./lib/gameConfig";

// Get player's upgrade state (UP balance + all ranks)
export const getUpgradeState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) return null;

    const queueRank = playerState.queueRank ?? 0;
    const staffRank = playerState.staffRank ?? 0;
    const computeRank = playerState.computeRank ?? 0;

    return {
      upgradePoints: playerState.upgradePoints ?? 0,
      level: playerState.level,
      ranks: {
        queue: queueRank,
        staff: staffRank,
        compute: computeRank,
      },
      values: {
        queue: getUpgradeValue("queue", queueRank),
        staff: getUpgradeValue("staff", staffRank),
        compute: getUpgradeValue("compute", computeRank),
      },
    };
  },
});

// Get detailed upgrade info for UI (includes lock reasons, next values, etc.)
export const getUpgradeDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) return null;

    const playerLevel = playerState.level;
    const upgradePoints = playerState.upgradePoints ?? 0;

    const upgrades = (Object.keys(LAB_UPGRADES) as UpgradeType[]).map((type) => {
      const def = LAB_UPGRADES[type];
      const currentRank =
        type === "queue"
          ? playerState.queueRank ?? 0
          : type === "staff"
            ? playerState.staffRank ?? 0
            : playerState.computeRank ?? 0;

      const nextRank = currentRank + 1;
      const isMaxRank = currentRank >= def.maxRank;
      const nextRankUnlocked = isRankUnlocked(nextRank, playerLevel);
      const requiredLevel = getRequiredLevelForRank(nextRank);

      let lockReason: string | undefined;
      if (isMaxRank) {
        lockReason = "Max rank reached";
      } else if (!nextRankUnlocked) {
        lockReason = `Unlocks at level ${requiredLevel}`;
      } else if (upgradePoints < 1) {
        lockReason = "Not enough UP";
      }

      return {
        id: type,
        name: def.name,
        description: def.description,
        unit: def.unit,
        currentRank,
        maxRank: def.maxRank,
        currentValue: getUpgradeValue(type, currentRank),
        nextValue: isMaxRank ? null : getUpgradeValue(type, nextRank),
        canUpgrade: !isMaxRank && nextRankUnlocked && upgradePoints >= 1,
        isMaxRank,
        lockReason,
        requiredLevelForNext: isMaxRank ? null : requiredLevel,
      };
    });

    return {
      upgradePoints,
      level: playerLevel,
      upgrades,
    };
  },
});

// Spend UP to purchase an upgrade rank
export const purchaseUpgrade = mutation({
  args: {
    userId: v.id("users"),
    upgradeType: v.union(
      v.literal("queue"),
      v.literal("staff"),
      v.literal("compute")
    ),
  },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) {
      throw new Error("Player state not found");
    }

    const upgradePoints = playerState.upgradePoints ?? 0;
    if (upgradePoints < 1) {
      throw new Error("Not enough Upgrade Points");
    }

    const def = LAB_UPGRADES[args.upgradeType];
    const currentRank =
      args.upgradeType === "queue"
        ? playerState.queueRank ?? 0
        : args.upgradeType === "staff"
          ? playerState.staffRank ?? 0
          : playerState.computeRank ?? 0;

    if (currentRank >= def.maxRank) {
      throw new Error("Already at max rank");
    }

    const nextRank = currentRank + 1;
    if (!isRankUnlocked(nextRank, playerState.level)) {
      const requiredLevel = getRequiredLevelForRank(nextRank);
      throw new Error(`Rank ${nextRank} requires level ${requiredLevel}`);
    }

    // Apply the upgrade
    const updates: Record<string, number> = {
      upgradePoints: upgradePoints - 1,
    };

    if (args.upgradeType === "queue") {
      updates.queueRank = nextRank;
    } else if (args.upgradeType === "staff") {
      updates.staffRank = nextRank;
    } else {
      updates.computeRank = nextRank;
    }

    await ctx.db.patch(playerState._id, updates);

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "unlock",
      title: `${def.name} Upgraded`,
      message: `Rank ${nextRank}: ${getUpgradeValue(args.upgradeType, nextRank)} ${def.unit}`,
      read: false,
      createdAt: Date.now(),
      deepLink: {
        view: "lab",
        target: "upgrades",
      },
    });

    return {
      success: true,
      upgradeType: args.upgradeType,
      newRank: nextRank,
      newValue: getUpgradeValue(args.upgradeType, nextRank),
    };
  },
});

// Get computed values for game logic (queue slots, staff cap, compute total)
export const getComputedStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) {
      return {
        queueSlots: LAB_UPGRADES.queue.base,
        staffCapacity: LAB_UPGRADES.staff.base,
        computeTotal: LAB_UPGRADES.compute.base,
      };
    }

    return {
      queueSlots: getUpgradeValue("queue", playerState.queueRank ?? 0),
      staffCapacity: getUpgradeValue("staff", playerState.staffRank ?? 0),
      computeTotal: getUpgradeValue("compute", playerState.computeRank ?? 0),
    };
  },
});

