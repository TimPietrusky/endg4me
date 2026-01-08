import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { getContentById } from "./lib/contentCatalog";

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

  // Get best model scores by type (all trained models count toward leaderboard)
  const allModels = await ctx.db
    .query("trainedModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  const bestScores: { llm?: number; tts?: number; vlm?: number } = {};

  for (const model of allModels) {
    const currentBest = bestScores[model.modelType];
    if (currentBest === undefined || model.score > currentBest) {
      bestScores[model.modelType] = model.score;
    }
  }

  // Calculate lab score
  const labScore = calculateLabScore(level, bestScores, queueRank, staffRank, computeRank);

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
      bestPublicScores: bestScores,
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
      bestPublicScores: bestScores,
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
 * Sync best models for a lab (one entry per BLUEPRINT)
 * Each blueprint (3B TTS, 7B TTS, etc.) has its own leaderboard entry
 */
async function syncBestModelsForLab(
  ctx: MutationCtx,
  labId: Id<"labs">
): Promise<void> {
  const allModels = await ctx.db
    .query("trainedModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  // Find best model per BLUEPRINT (highest score wins)
  const bestByBlueprint: Record<string, Doc<"trainedModels">> = {};
  for (const model of allModels) {
    const current = bestByBlueprint[model.blueprintId];
    if (!current || model.score > current.score) {
      bestByBlueprint[model.blueprintId] = model;
    }
  }

  // Get existing best model entries for this lab
  const existingEntries = await ctx.db
    .query("worldBestModels")
    .withIndex("by_lab", (q) => q.eq("labId", labId))
    .collect();

  const existingByBlueprint: Record<string, Doc<"worldBestModels">> = {};
  for (const entry of existingEntries) {
    existingByBlueprint[entry.blueprintId] = entry;
  }

  // Get all blueprint IDs we need to track
  const allBlueprintIds = new Set([
    ...Object.keys(bestByBlueprint),
    ...Object.keys(existingByBlueprint),
  ]);

  // Update or create entries for each blueprint
  for (const blueprintId of allBlueprintIds) {
    const bestModel = bestByBlueprint[blueprintId];
    const existingEntry = existingByBlueprint[blueprintId];

    if (bestModel) {
      // Has a model of this blueprint - update or create entry
      if (existingEntry) {
        await ctx.db.patch(existingEntry._id, {
          modelName: bestModel.name,
          score: bestModel.score,
          version: bestModel.version,
          modelId: bestModel._id,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("worldBestModels", {
          labId,
          modelType: bestModel.modelType,
          blueprintId: bestModel.blueprintId,
          modelName: bestModel.name,
          score: bestModel.score,
          version: bestModel.version,
          modelId: bestModel._id,
          updatedAt: Date.now(),
        });
      }
    } else {
      // No model of this blueprint anymore - delete entry if exists
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

export interface ModelLeaderboardEntry {
  labId: string;
  labName: string;
  modelName: string;
  score: number;
  version: number;
  rank: number;
  isCurrentPlayer: boolean;
}

export interface BlueprintLeaderboard {
  blueprintId: string;
  blueprintName: string;
  modelType: "llm" | "tts" | "vlm";
  entries: ModelLeaderboardEntry[];
  myRank: number | null;
  myScore: number | null;
}

/**
 * Get models leaderboard grouped by blueprint for a model type
 * Each blueprint (3B TTS, 7B TTS, etc.) has its own leaderboard
 */
export const getBlueprintLeaderboards = query({
  args: {
    labId: v.id("labs"),
    modelType: v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm")),
  },
  handler: async (ctx, args): Promise<{ blueprints: BlueprintLeaderboard[] }> => {
    // Get all best models for this type
    const allEntries = await ctx.db
      .query("worldBestModels")
      .withIndex("by_type", (q) => q.eq("modelType", args.modelType))
      .collect();

    // Get lab names
    const labIds = [...new Set(allEntries.map((e) => e.labId))];
    const labs = await Promise.all(labIds.map((id) => ctx.db.get(id)));
    const labNameMap: Record<string, string> = {};
    for (const lab of labs) {
      if (lab) labNameMap[lab._id] = lab.name;
    }

    // Group by blueprint
    const byBlueprint: Record<string, typeof allEntries> = {};
    for (const entry of allEntries) {
      if (!byBlueprint[entry.blueprintId]) {
        byBlueprint[entry.blueprintId] = [];
      }
      byBlueprint[entry.blueprintId].push(entry);
    }

    // Build leaderboard for each blueprint
    const blueprints: BlueprintLeaderboard[] = [];

    for (const [blueprintId, entries] of Object.entries(byBlueprint)) {
      // Sort by score desc
      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
        return a.labId.localeCompare(b.labId);
      });

      // Find player's entry
      let myRank: number | null = null;
      let myScore: number | null = null;
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].labId === args.labId) {
          myRank = i + 1;
          myScore = entries[i].score;
          break;
        }
      }

      // Get blueprint name from content catalog
      // Try both the blueprintId as-is and without "bp_" prefix
      let content = getContentById(blueprintId);
      if (!content && blueprintId.startsWith("bp_")) {
        content = getContentById(blueprintId.replace("bp_", ""));
      }
      // Fallback: convert "tts_3b" or "bp_tts_3b" to "3B TTS" format
      let blueprintName = content?.name;
      if (!blueprintName) {
        const cleanId = blueprintId.replace(/^bp_/, "");
        const match = cleanId.match(/^(tts|llm|vlm)_(\d+)b$/i);
        if (match) {
          blueprintName = `${match[2]}B ${match[1].toUpperCase()}`;
        } else {
          blueprintName = cleanId;
        }
      }

      // Take top entries (limit to reasonable amount)
      const topEntries = entries.slice(0, 20);

      blueprints.push({
        blueprintId,
        blueprintName,
        modelType: args.modelType,
        entries: topEntries.map((entry, i) => ({
          labId: entry.labId,
          labName: labNameMap[entry.labId] ?? "Unknown Lab",
          modelName: entry.modelName,
          score: entry.score,
          version: entry.version,
          rank: i + 1,
          isCurrentPlayer: entry.labId === args.labId,
        })),
        myRank,
        myScore,
      });
    }

    // Sort blueprints by name (e.g., 3B TTS, 7B TTS, 30B TTS)
    blueprints.sort((a, b) => a.blueprintName.localeCompare(b.blueprintName));

    return { blueprints };
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
export const rebuildAllLeaderboards = mutation({
  args: {},
  handler: async (ctx) => {
    const labs = await ctx.db.query("labs").collect();
    for (const lab of labs) {
      await syncLeaderboardForLab(ctx, lab._id);
    }
    return { synced: labs.length };
  },
});

/**
 * Debug query to check leaderboard state for a lab
 */
export const debugLeaderboardState = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    // Get trained models
    const trainedModels = await ctx.db
      .query("trainedModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    // Get worldLeaderboard entry
    const leaderboardEntry = await ctx.db
      .query("worldLeaderboard")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .first();

    // Get worldBestModels entries
    const bestModelsEntries = await ctx.db
      .query("worldBestModels")
      .withIndex("by_lab", (q) => q.eq("labId", args.labId))
      .collect();

    return {
      trainedModels: {
        total: trainedModels.length,
        models: trainedModels.map((m) => ({
          id: m._id,
          name: m.name,
          type: m.modelType,
          score: m.score,
        })),
      },
      worldLeaderboard: leaderboardEntry
        ? {
            exists: true,
            labScore: leaderboardEntry.labScore,
            bestScores: leaderboardEntry.bestPublicScores,
            level: leaderboardEntry.level,
          }
        : { exists: false },
      worldBestModels: bestModelsEntries.map((e) => ({
        type: e.modelType,
        modelName: e.modelName,
        score: e.score,
        version: e.version,
      })),
    };
  },
});

