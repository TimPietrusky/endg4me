import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  LAB_UPGRADES,
  FOUNDER_UPGRADE_BONUSES,
  getUpgradeValue,
  getRequiredLevelForRank,
  isRankUnlocked,
  type UpgradeType,
} from "./lib/gameConfig";
import { syncLeaderboardForLab } from "./leaderboard";

// Helper to get rank for any upgrade type
function getRankForType(playerState: {
  queueRank?: number;
  staffRank?: number;
  computeRank?: number;
  researchSpeedRank?: number;
  moneyMultiplierRank?: number;
}, type: UpgradeType): number {
  switch (type) {
    case "queue": return playerState.queueRank ?? 0;
    case "staff": return playerState.staffRank ?? 0;
    case "compute": return playerState.computeRank ?? 0;
    case "researchSpeed": return playerState.researchSpeedRank ?? 0;
    case "moneyMultiplier": return playerState.moneyMultiplierRank ?? 0;
  }
}

// Get player's upgrade state (UP balance + all ranks)
export const getUpgradeState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) return null;

    return {
      upgradePoints: playerState.upgradePoints ?? 0,
      level: playerState.level,
      ranks: {
        queue: playerState.queueRank ?? 0,
        staff: playerState.staffRank ?? 0,
        compute: playerState.computeRank ?? 0,
        researchSpeed: playerState.researchSpeedRank ?? 0,
        moneyMultiplier: playerState.moneyMultiplierRank ?? 0,
      },
      values: {
        queue: getUpgradeValue("queue", playerState.queueRank ?? 0),
        staff: getUpgradeValue("staff", playerState.staffRank ?? 0),
        compute: getUpgradeValue("compute", playerState.computeRank ?? 0),
        researchSpeed: getUpgradeValue("researchSpeed", playerState.researchSpeedRank ?? 0),
        moneyMultiplier: getUpgradeValue("moneyMultiplier", playerState.moneyMultiplierRank ?? 0),
      },
    };
  },
});

// Get detailed upgrade info for UI (includes lock reasons, next values, founder bonuses)
export const getUpgradeDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) return null;

    // Get lab for founder type
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const founderType = (lab?.founderType ?? "technical") as keyof typeof FOUNDER_UPGRADE_BONUSES;
    const founderBonuses = FOUNDER_UPGRADE_BONUSES[founderType];

    const playerLevel = playerState.level;
    const upgradePoints = playerState.upgradePoints ?? 0;

    const upgrades = (Object.keys(LAB_UPGRADES) as UpgradeType[]).map((type) => {
      const def = LAB_UPGRADES[type];
      const currentRank = getRankForType(playerState, type);

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

      // Calculate founder bonus for this upgrade type
      const founderBonus = type === "researchSpeed" 
        ? founderBonuses.researchSpeed 
        : type === "moneyMultiplier"
          ? founderBonuses.moneyMultiplier
          : 0;

      const baseValue = getUpgradeValue(type, currentRank);
      const maxBaseValue = getUpgradeValue(type, def.maxRank);
      const nextBaseValue = isMaxRank ? null : getUpgradeValue(type, nextRank);

      return {
        id: type,
        name: def.name,
        description: def.description,
        unit: def.unit,
        currentRank,
        maxRank: def.maxRank,
        // For researchSpeed/moneyMultiplier, add founder bonus to display values
        currentValue: baseValue + founderBonus,
        maxValue: maxBaseValue + founderBonus,
        nextValue: nextBaseValue !== null ? nextBaseValue + founderBonus : null,
        founderBonus,  // So UI can show "25% from lab type"
        canUpgrade: !isMaxRank && nextRankUnlocked && upgradePoints >= 1,
        isMaxRank,
        lockReason,
        requiredLevelForNext: isMaxRank ? null : requiredLevel,
        isPercent: def.isPercent,
        isMultiplier: def.isMultiplier,
      };
    });

    return {
      upgradePoints,
      level: playerLevel,
      founderType,
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
      v.literal("compute"),
      v.literal("researchSpeed"),
      v.literal("moneyMultiplier")
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
    const currentRank = getRankForType(playerState, args.upgradeType);

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

    switch (args.upgradeType) {
      case "queue":
        updates.queueRank = nextRank;
        break;
      case "staff":
        updates.staffRank = nextRank;
        break;
      case "compute":
        updates.computeRank = nextRank;
        break;
      case "researchSpeed":
        updates.researchSpeedRank = nextRank;
        break;
      case "moneyMultiplier":
        updates.moneyMultiplierRank = nextRank;
        break;
    }

    await ctx.db.patch(playerState._id, updates);

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "unlock",
      title: `${def.name} Upgraded`,
      message: `Rank ${nextRank}: ${getUpgradeValue(args.upgradeType, nextRank)}${def.unit}`,
      read: false,
      createdAt: Date.now(),
      deepLink: {
        view: "lab",
        target: "upgrades",
      },
    });

    // Sync leaderboard (upgrade ranks affect Lab Score)
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (lab) {
      await syncLeaderboardForLab(ctx, lab._id);
    }

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

