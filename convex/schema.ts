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

  // Lab State - resources and capacity
  labState: defineTable({
    labId: v.id("labs"),
    cash: v.number(),
    researchPoints: v.number(),
    computeUnits: v.number(),
    staffCapacity: v.number(),
    parallelTasks: v.number(),
    // Track staff hired
    juniorResearchers: v.number(),
    // Attribute bonuses (from Research spending)
    researchSpeedBonus: v.optional(v.number()), // Percentage bonus, e.g., 10 = 10% faster
    moneyMultiplier: v.optional(v.number()),    // Multiplier, e.g., 1.1 = 10% more
    // DEPRECATED: reputation removed in 002_progression, kept optional for migration
    reputation: v.optional(v.number()),
  }).index("by_lab", ["labId"]),

  // Player State - personal progression
  playerState: defineTable({
    userId: v.id("users"),
    level: v.number(),
    experience: v.number(),
    clanId: v.optional(v.id("clans")),
  }).index("by_user", ["userId"]),

  // Tasks - queued actions
  tasks: defineTable({
    labId: v.id("labs"),
    type: v.union(
      v.literal("train_small_model"),
      v.literal("train_medium_model"),
      v.literal("freelance_contract"),
      v.literal("hire_junior_researcher"),
      v.literal("rent_gpu_cluster")
    ),
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
        // DEPRECATED: reputation removed in 002_progression, kept optional for migration
        reputation: v.optional(v.number()),
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
    modelType: v.union(v.literal("small_3b"), v.literal("medium_7b")),
    name: v.string(), // Generated name like "Model #1"
    score: v.number(), // Research points earned = model quality score
    trainedAt: v.number(),
    // Visibility: public models appear on leaderboards and public lab page
    // Optional for migration - existing models default to private
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_score", ["labId", "score"])
    .index("by_visibility", ["visibility"]),

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
      v.literal("research_complete")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    // Optional metadata
    taskId: v.optional(v.id("tasks")),
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
    .index("by_user_unread", ["userId", "read"]),

  // Research Nodes - RP spending for permanent unlocks
  researchNodes: defineTable({
    nodeId: v.string(), // Unique identifier like "llm_17b_blueprint"
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("attributes"),   // Global stats: queue, staff, CU, speed, money
      v.literal("blueprints"),   // Model blueprints
      v.literal("capabilities"), // New job types, features
      v.literal("perks")         // Passive bonuses
    ),
    rpCost: v.number(),
    // Requirements
    minLevel: v.number(),
    prerequisiteNodes: v.array(v.string()), // nodeIds of required nodes
    // What this unlocks
    unlockType: v.union(
      v.literal("attribute"),    // Increases global stat
      v.literal("blueprint"),
      v.literal("job"),
      v.literal("world_action"),
      v.literal("perk")
    ),
    unlockTarget: v.string(), // ID of what gets unlocked
    unlockDescription: v.string(),
    // For attributes: which stat and how much
    attributeType: v.optional(v.union(
      v.literal("queue_slots"),
      v.literal("staff_capacity"),
      v.literal("compute_units"),
      v.literal("research_speed"),
      v.literal("money_multiplier")
    )),
    attributeValue: v.optional(v.number()), // How much to add/multiply
    // Visual positioning for skill tree (optional)
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
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
});

