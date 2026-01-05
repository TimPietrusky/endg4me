import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

// =============================================================================
// LEADERBOARD - Lab Score calculation + neighbors slice (006_leaderboard_day1)
// =============================================================================

// -----------------------------------------------------------------------------
// LAB SCORE CALCULATION
// -----------------------------------------------------------------------------

/**
 * Lab Score formula:
 * labScore = levelScore + modelScore + upgradeScore
 * 
 * Where:
 * - levelScore = playerLevel * 100
 * - modelScore = sum(bestPublicModelScoreByType) for llm, tts, vlm
 * - upgradeScore = (queueRank + staffRank + computeRank) * 20
 */
export function calculateLabScore(
  level: number,
  bestPublicScores: { llm?: number; tts?: number; vlm?: number },
  queueRank: number,
  staffRank: number,
  computeRank: number
): number {
  const levelScore = level * 100;
  const modelScore = (bestPublicScores.llm ?? 0) + (bestPublicScores.tts ?? 0) + (bestPublicScores.vlm ?? 0);
  const upgradeScore = (queueRank + staffRank + computeRank) * 20;
  return levelScore + modelScore + upgradeScore;
}

// -----------------------------------------------------------------------------
// SYNC FUNCTIONS (called from other mutations)
// -----------------------------------------------------------------------------

/**
 * Sync leaderboard entry for a lab
 * Call this when: level up, upgrade purchase, model train, visibility toggle
 */
export async function syncLeaderboardForLab(
  ctx: MutationCtx,
  labId: Id<"labs">
): Promise<void> {
  const lab = await ctx.db.get(labId);
  if (!lab) return;

  // Get player state for level and upgrade ranks
  const playerState = await ctx.db
    .query("playerState")
    .withIndex("by_user", (q) => q.eq("userId", lab.userId))
    .first();

  const level = playerState?.level ?? 1;
  const queueRank = playerState?.queueRank ?? 0;
  const staffRank = playerState?.staffRank ?? 0;
  const computeRank = playerState?.computeRank ?? 0;

  // Get best public model scores by type
  const publicModels = await ctx.db
    .query("trainedModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  const publicOnly = publicModels.filter((m) => m.visibility === "public");

  const bestPublicScores: { llm?: number; tts?: number; vlm?: number } = {};

  for (const model of publicOnly) {
    const currentBest = bestPublicScores[model.modelType];
    if (currentBest === undefined || model.score > currentBest) {
      bestPublicScores[model.modelType] = model.score;
    }
  }

  // Calculate lab score
  const labScore = calculateLabScore(level, bestPublicScores, queueRank, staffRank, computeRank);

  // Upsert leaderboard entry
  const existingEntry = await ctx.db
    .query("worldLeaderboard")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .first();

  if (existingEntry) {
    await ctx.db.patch(existingEntry._id, {
      labName: lab.name,
      level,
      labScore,
      bestPublicScores,
      queueRank,
      staffRank,
      computeRank,
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("worldLeaderboard", {
      labId,
      labName: lab.name,
      level,
      labScore,
      bestPublicScores,
      queueRank,
      staffRank,
      computeRank,
      updatedAt: Date.now(),
    });
  }

  // Sync best models table
  await syncBestModelsForLab(ctx, labId);
}

/**
 * Sync best public models for a lab (one entry per type)
 */
async function syncBestModelsForLab(
  ctx: MutationCtx,
  labId: Id<"labs">
): Promise<void> {
  const allModels = await ctx.db
    .query("trainedModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  const publicModels = allModels.filter((m) => m.visibility === "public");

  // Find best model per type
  const bestByType: Record<string, Doc<"trainedModels">> = {};
  for (const model of publicModels) {
    const current = bestByType[model.modelType];
    if (!current || model.score > current.score) {
      bestByType[model.modelType] = model;
    }
  }

  // Get existing best model entries for this lab
  const existingEntries = await ctx.db
    .query("worldBestModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  const existingByType: Record<string, Doc<"worldBestModels">> = {};
  for (const entry of existingEntries) {
    existingByType[entry.modelType] = entry;
  }

  // Update or create entries for types with public models
  for (const type of ["llm", "tts", "vlm"] as const) {
    const bestModel = bestByType[type];
    const existingEntry = existingByType[type];

    if (bestModel) {
      // Has a public model of this type
      if (existingEntry) {
        await ctx.db.patch(existingEntry._id, {
          blueprintId: bestModel.blueprintId,
          modelName: bestModel.name,
          score: bestModel.score,
          version: bestModel.version,
          modelId: bestModel._id,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("worldBestModels", {
          labId,
          modelType: type,
          blueprintId: bestModel.blueprintId,
          modelName: bestModel.name,
          score: bestModel.score,
          version: bestModel.version,
          modelId: bestModel._id,
          updatedAt: Date.now(),
        });
      }
    } else {
      // No public model of this type - delete entry if exists
      if (existingEntry) {
        await ctx.db.delete(existingEntry._id);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// QUERIES - Neighbors slice for Labs and Models
// -----------------------------------------------------------------------------

export interface LabLeaderboardRow {
  labId: string;
  labName: string;
  level: number;
  labScore: number;
  bestPublicScores: { llm?: number; tts?: number; vlm?: number };
  rank: number;
  isCurrentPlayer: boolean;
}

/**
 * Get labs leaderboard slice (20 above + me + 20 below)
 */
export const getLabLeaderboardSlice = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args): Promise<{ rows: LabLeaderboardRow[]; myRank: number | null }> => {
    // Ensure the player has a leaderboard entry
    const myEntry = await ctx.db
      .query("worldLeaderboard")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    // Get all entries sorted by labScore desc
    // In production you'd want a more efficient approach, but for MVP this works
    const allEntries = await ctx.db
      .query("worldLeaderboard")
      .collect();

    // Sort by labScore desc, then updatedAt desc, then labId for determinism
    allEntries.sort((a, b) => {
      if (b.labScore !== a.labScore) return b.labScore - a.labScore;
      if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
      return a.labId.localeCompare(b.labId);
    });

    // Find my rank (1-indexed)
    let myRank: number | null = null;
    let myIndex = -1;
    for (let i = 0; i < allEntries.length; i++) {
      if (allEntries[i].labId === args.labId) {
        myRank = i + 1;
        myIndex = i;
        break;
      }
    }

    // Calculate slice bounds
    let startIndex = 0;
    let endIndex = Math.min(41, allEntries.length);

    if (myIndex >= 0) {
      // 20 above + me + 20 below
      startIndex = Math.max(0, myIndex - 20);
      endIndex = Math.min(allEntries.length, myIndex + 21);

      // Adjust to always show 41 if possible
      if (endIndex - startIndex < 41 && allEntries.length >= 41) {
        if (startIndex === 0) {
          endIndex = Math.min(41, allEntries.length);
        } else if (endIndex === allEntries.length) {
          startIndex = Math.max(0, allEntries.length - 41);
        }
      }
    }

    const slice = allEntries.slice(startIndex, endIndex);

    const rows: LabLeaderboardRow[] = slice.map((entry, i) => ({
      labId: entry.labId,
      labName: entry.labName,
      level: entry.level,
      labScore: entry.labScore,
      bestPublicScores: entry.bestPublicScores,
      rank: startIndex + i + 1,
      isCurrentPlayer: entry.labId === args.labId,
    }));

    return { rows, myRank };
  },
});

export interface ModelLeaderboardRow {
  labId: string;
  labName: string;
  modelName: string;
  blueprintId: string;
  score: number;
  version: number;
  rank: number;
  isCurrentPlayer: boolean;
}

/**
 * Get models leaderboard slice for a specific type (20 above + me + 20 below)
 */
export const getModelLeaderboardSlice = query({
  args: {
    labId: v.id("labs"),
    modelType: v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm")),
  },
  handler: async (ctx, args): Promise<{ rows: ModelLeaderboardRow[]; myRank: number | null; hasPublicModel: boolean }> => {
    // Check if player has a public model of this type
    const myBestModel = await ctx.db
      .query("worldBestModels")
      .withIndex("by_lab_type", (q) => q.eq("labId", args.labId).eq("modelType", args.modelType))
      .first();

    const hasPublicModel = myBestModel !== null;

    // Get all best models for this type
    const allEntries = await ctx.db
      .query("worldBestModels")
      .withIndex("by_type_score", (q) => q.eq("modelType", args.modelType))
      .collect();

    // Sort by score desc
    allEntries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
      return a.labId.localeCompare(b.labId);
    });

    // Get lab names
    const labIds = [...new Set(allEntries.map((e) => e.labId))];
    const labs = await Promise.all(labIds.map((id) => ctx.db.get(id)));
    const labNameMap: Record<string, string> = {};
    for (const lab of labs) {
      if (lab) labNameMap[lab._id] = lab.name;
    }

    // Find my rank
    let myRank: number | null = null;
    let myIndex = -1;
    if (hasPublicModel) {
      for (let i = 0; i < allEntries.length; i++) {
        if (allEntries[i].labId === args.labId) {
          myRank = i + 1;
          myIndex = i;
          break;
        }
      }
    }

    // Calculate slice bounds
    let startIndex = 0;
    let endIndex = Math.min(41, allEntries.length);

    if (myIndex >= 0) {
      startIndex = Math.max(0, myIndex - 20);
      endIndex = Math.min(allEntries.length, myIndex + 21);

      if (endIndex - startIndex < 41 && allEntries.length >= 41) {
        if (startIndex === 0) {
          endIndex = Math.min(41, allEntries.length);
        } else if (endIndex === allEntries.length) {
          startIndex = Math.max(0, allEntries.length - 41);
        }
      }
    }

    const slice = allEntries.slice(startIndex, endIndex);

    const rows: ModelLeaderboardRow[] = slice.map((entry, i) => ({
      labId: entry.labId,
      labName: labNameMap[entry.labId] ?? "Unknown Lab",
      modelName: entry.modelName,
      blueprintId: entry.blueprintId,
      score: entry.score,
      version: entry.version,
      rank: startIndex + i + 1,
      isCurrentPlayer: entry.labId === args.labId,
    }));

    return { rows, myRank, hasPublicModel };
  },
});

// -----------------------------------------------------------------------------
// MANUAL SYNC (for dev/testing)
// -----------------------------------------------------------------------------

/**
 * Manually sync leaderboard for a lab (exposed as mutation for dev)
 */
export const syncLeaderboard = mutation({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    await syncLeaderboardForLab(ctx, args.labId);
    return { success: true };
  },
});

/**
 * Rebuild all leaderboard entries (dev/migration tool)
 */
export const rebuildAllLeaderboards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const labs = await ctx.db.query("labs").collect();
    for (const lab of labs) {
      await syncLeaderboardForLab(ctx, lab._id);
    }
    return { synced: labs.length };
  },
});

