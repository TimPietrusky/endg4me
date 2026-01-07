import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  LAB_UPGRADES,
  FOUNDER_BONUSES,
  getUpgradeValue,
  getRequiredLevelForRank,
  isRankUnlocked,
  type UpgradeType,
  type FounderType,
} from "./lib/gameConfig";
import { getContentById } from "./lib/contentCatalog";
import { syncLeaderboardForLab } from "./leaderboard";
import { getEffectiveNow } from "./dev";

// Helper to get rank for any upgrade type
function getRankForType(playerState: {
  queueRank?: number;
  staffRank?: number;
  computeRank?: number;
  speedRank?: number;
  moneyMultiplierRank?: number;
}, type: UpgradeType): number {
  switch (type) {
    case "queue": return playerState.queueRank ?? 0;
    case "staff": return playerState.staffRank ?? 0;
    case "compute": return playerState.computeRank ?? 0;
    case "speed": return playerState.speedRank ?? 0;
    case "moneyMultiplier": return playerState.moneyMultiplierRank ?? 0;
  }
}

// Get active hires and their stat contributions
export const getActiveHires = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const lab = await ctx.db.get(args.labId);
    if (!lab) return { hires: [], bonuses: {} };

    const effectiveNow = await getEffectiveNow(ctx, lab.userId);

    // Get all in-progress hire tasks
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", args.labId).eq("status", "in_progress")
      )
      .collect();

    const hires: {
      jobId: string;
      name: string;
      hireStat: UpgradeType;
      hireBonus: number;
      completesAt: number;
      remainingMs: number;
    }[] = [];

    const bonuses: Partial<Record<UpgradeType, number>> = {};

    for (const task of activeTasks) {
      const content = getContentById(task.type);
      if (content?.contentType === "hire" && content.hireStat && content.hireBonus) {
        const remainingMs = (task.completesAt ?? 0) - effectiveNow;
        if (remainingMs > 0) {
          hires.push({
            jobId: task.type,
            name: content.name,
            hireStat: content.hireStat,
            hireBonus: content.hireBonus,
            completesAt: task.completesAt ?? 0,
            remainingMs,
          });

          // Accumulate bonuses by stat
          const stat = content.hireStat;
          bonuses[stat] = (bonuses[stat] ?? 0) + content.hireBonus;
        }
      }
    }

    return { hires, bonuses };
  },
});

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
        speed: playerState.speedRank ?? 0,
        moneyMultiplier: playerState.moneyMultiplierRank ?? 0,
      },
      values: {
        queue: getUpgradeValue("queue", playerState.queueRank ?? 0),
        staff: getUpgradeValue("staff", playerState.staffRank ?? 0),
        compute: getUpgradeValue("compute", playerState.computeRank ?? 0),
        speed: getUpgradeValue("speed", playerState.speedRank ?? 0),
        moneyMultiplier: getUpgradeValue("moneyMultiplier", playerState.moneyMultiplierRank ?? 0),
      },
    };
  },
});

// Get detailed upgrade info for UI (includes breakdown: UP rank, founder, active hires)
export const getUpgradeDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playerState = await ctx.db
      .query("playerState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!playerState) return null;

    // Get lab for founder type and active hires
    const lab = await ctx.db
      .query("labs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!lab) return null;

    const founderType = lab.founderType as FounderType;
    const founderBonuses = FOUNDER_BONUSES[founderType];

    // Get active hire bonuses
    const effectiveNow = await getEffectiveNow(ctx, args.userId);
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_lab_status", (q) =>
        q.eq("labId", lab._id).eq("status", "in_progress")
      )
      .collect();

    const hireBonuses: Partial<Record<UpgradeType, number>> = {};
    const activeHires: { name: string; stat: UpgradeType; bonus: number; remainingMs: number }[] = [];

    for (const task of activeTasks) {
      const content = getContentById(task.type);
      if (content?.contentType === "hire" && content.hireStat && content.hireBonus) {
        const remainingMs = (task.completesAt ?? 0) - effectiveNow;
        if (remainingMs > 0) {
          const stat = content.hireStat;
          hireBonuses[stat] = (hireBonuses[stat] ?? 0) + content.hireBonus;
          activeHires.push({
            name: content.name.replace("Hire ", ""),
            stat,
            bonus: content.hireBonus,
            remainingMs,
          });
        }
      }
    }

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

      // Calculate bonuses from each source
      const upValue = getUpgradeValue(type, currentRank);
      const founderBonus = founderBonuses[type] ?? 0;
      const hireBonus = hireBonuses[type] ?? 0;

      // Total value combines all sources
      const totalValue = upValue + founderBonus + hireBonus;

      // Max values for progress display
      const maxUpValue = getUpgradeValue(type, def.maxRank);
      const maxTotalValue = maxUpValue + founderBonus; // Hires are temporary, don't count in max

      const nextUpValue = isMaxRank ? null : getUpgradeValue(type, nextRank);

      return {
        id: type,
        name: def.name,
        description: def.description,
        unit: def.unit,
        currentRank,
        maxRank: def.maxRank,
        // Breakdown of values
        upValue,
        founderBonus,
        hireBonus,
        // Combined totals
        currentValue: totalValue,
        maxValue: maxTotalValue,
        nextValue: nextUpValue !== null ? nextUpValue + founderBonus + hireBonus : null,
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
      activeHires,
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
      v.literal("speed"),
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
      case "speed":
        updates.speedRank = nextRank;
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
