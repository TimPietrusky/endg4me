import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - linked to WorkOS
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_workos_id", ["workosUserId"]),

  // Labs - one per user
  labs: defineTable({
    userId: v.id("users"),
    name: v.string(),
    founderType: v.union(v.literal("technical"), v.literal("business")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Lab State - resources and RP-based bonuses
  // NOTE: Queue/Staff/Compute capacity now comes from playerState ranks (UP system)
  labState: defineTable({
    labId: v.id("labs"),
    cash: v.number(),
    researchPoints: v.number(),
    juniorResearchers: v.number(),
    // RP-based perk bonuses (from Research spending)
    speedBonus: v.optional(v.number()), // Percentage bonus, e.g., 10 = 10% faster
    moneyMultiplier: v.optional(v.number()),    // Multiplier, e.g., 1.1 = 10% more
  }).index("by_lab", ["labId"]),

  // Player State - personal progression
  playerState: defineTable({
    userId: v.id("users"),
    level: v.number(),
    experience: v.number(),
    clanId: v.optional(v.id("clans")),
    // Upgrade Points system (004_upgrade_points)
    upgradePoints: v.optional(v.number()), // UP balance (earned on level up)
    queueRank: v.optional(v.number()),     // Queue upgrade rank (0 = base)
    staffRank: v.optional(v.number()),     // Staff upgrade rank (0 = base)
    computeRank: v.optional(v.number()),   // Compute upgrade rank (0 = base)
    speedRank: v.optional(v.number()),  // Speed rank (0 = base)
    moneyMultiplierRank: v.optional(v.number()), // Money multiplier rank (0 = base)
  }).index("by_user", ["userId"]),

  // Player Unlocks - tracks what content is unlocked via research
  playerUnlocks: defineTable({
    userId: v.id("users"),
    unlockedContentIds: v.array(v.string()), // Content IDs from CONTENT_CATALOG
  }).index("by_user", ["userId"]),

  // Tasks - queued actions (supports both legacy and new job IDs)
  tasks: defineTable({
    labId: v.id("labs"),
    // Job type - supports both legacy task types and new job IDs from contentCatalog
    type: v.string(), // Now accepts any job ID string
    status: v.union(
      v.literal("queued"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    startedAt: v.optional(v.number()),
    completesAt: v.optional(v.number()),
    createdAt: v.number(),
    // Results stored on completion
    rewards: v.optional(
      v.object({
        cash: v.optional(v.number()),
        researchPoints: v.optional(v.number()),
        experience: v.optional(v.number()),
      })
    ),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_status", ["labId", "status"])
    .index("by_completes_at", ["completesAt"]),

  // Trained Models - collection of completed training runs
  trainedModels: defineTable({
    labId: v.id("labs"),
    taskId: v.id("tasks"),
    blueprintId: v.string(),                     // Content ID, e.g., "tts_3b"
    modelType: v.union(                          // Model category
      v.literal("llm"),
      v.literal("tts"),
      v.literal("vlm")
    ),
    name: v.string(),
    version: v.number(),
    score: v.number(),
    trainedAt: v.number(),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_blueprint", ["labId", "blueprintId"])
    .index("by_lab_score", ["labId", "score"])
    .index("by_visibility", ["visibility"])
    .index("by_model_type", ["modelType"]),

  // Freelance cooldown tracking
  freelanceCooldowns: defineTable({
    labId: v.id("labs"),
    availableAt: v.number(),
  }).index("by_lab", ["labId"]),

  // Clans
  clans: defineTable({
    name: v.string(),
    creatorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("task_complete"),
      v.literal("level_up"),
      v.literal("unlock"),
      v.literal("hire_complete"),
      v.literal("research_complete"),
      v.literal("milestone")  // New type for inbox events
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    // Optional metadata
    taskId: v.optional(v.id("tasks")),
    eventId: v.optional(v.string()), // For milestone events
    // Deep link for navigation
    deepLink: v.optional(
      v.object({
        view: v.union(
          v.literal("operate"),
          v.literal("research"),
          v.literal("lab"),
          v.literal("inbox"),
          v.literal("world")
        ),
        target: v.optional(v.string()),
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_user_event", ["userId", "eventId"]),

  // Research Nodes - RP spending for perks (speed bonus, money multiplier)
  // NOTE: This table is for DB storage if needed, but nodes come from contentCatalog
  researchNodes: defineTable({
    nodeId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("blueprint"),
      v.literal("capability"),
      v.literal("perk")
    ),
    rpCost: v.number(),
    minLevel: v.number(),
    prerequisiteNodes: v.array(v.string()),
    unlockType: v.union(
      v.literal("blueprint"),
      v.literal("job"),
      v.literal("world_action"),
      v.literal("perk"),
      v.literal("system_flag")
    ),
    unlockTarget: v.string(),
    unlockDescription: v.string(),
    // For perks: which bonus and how much
    perkType: v.optional(v.union(
      v.literal("speed"),
      v.literal("money_multiplier")
    )),
    perkValue: v.optional(v.number()),
  }).index("by_node_id", ["nodeId"])
   .index("by_category", ["category"]),

  // Player Research Progress - tracks which nodes a player has purchased
  playerResearch: defineTable({
    userId: v.id("users"),
    nodeId: v.string(),
    purchasedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_node", ["userId", "nodeId"]),

  // Unlock Registry - single source of truth for all unlock gating
  // This defines what's available and what gates it
  unlockRegistry: defineTable({
    unlockId: v.string(), // Unique identifier
    name: v.string(),
    category: v.string(), // job, blueprint, world_action, etc.
    // Gating requirements (all must be met)
    minLevel: v.optional(v.number()),
    requiredResearchNode: v.optional(v.string()),
    // Where this appears
    appearsIn: v.union(
      v.literal("operate"),
      v.literal("research"),
      v.literal("lab"),
      v.literal("world")
    ),
  }).index("by_unlock_id", ["unlockId"]),

  // World Leaderboard - materialized Lab Score per player (006_leaderboard_day1)
  worldLeaderboard: defineTable({
    labId: v.id("labs"),
    labName: v.string(),
    level: v.number(),
    labScore: v.number(),
    // Best public model scores by type (only public models count)
    bestPublicScores: v.object({
      llm: v.optional(v.number()),
      tts: v.optional(v.number()),
      vlm: v.optional(v.number()),
    }),
    // Upgrade ranks for score calculation
    queueRank: v.number(),
    staffRank: v.number(),
    computeRank: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_score", ["labScore"]),

  // World Best Models - best model per lab per BLUEPRINT (e.g., best 7B TTS for each lab)
  worldBestModels: defineTable({
    labId: v.id("labs"),
    modelType: v.union(v.literal("llm"), v.literal("tts"), v.literal("vlm")),
    blueprintId: v.string(),  // e.g., "tts_7b", "llm_3b"
    modelName: v.string(),
    score: v.number(),
    version: v.number(),
    modelId: v.id("trainedModels"),
    updatedAt: v.number(),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_blueprint", ["labId", "blueprintId"])
    .index("by_blueprint_score", ["blueprintId", "score"])
    .index("by_type", ["modelType"]),

  // Dev User Settings - Time Warp for dev/testing (007_dev_time_warp)
  devUserSettings: defineTable({
    userId: v.id("users"),
    timeScale: v.number(), // 1, 5, 20, or 100
    warpEnabledAtRealMs: v.optional(v.number()),
    warpEnabledAtEffectiveMs: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
