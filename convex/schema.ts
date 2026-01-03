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
    reputation: v.number(),
    computeUnits: v.number(),
    staffCapacity: v.number(),
    parallelTasks: v.number(),
    // Track staff hired
    juniorResearchers: v.number(),
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
        reputation: v.optional(v.number()),
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
    modelType: v.union(v.literal("small_3b"), v.literal("medium_7b")),
    name: v.string(), // Generated name like "Model #1"
    score: v.number(), // Research points earned = model quality score
    trainedAt: v.number(),
  })
    .index("by_lab", ["labId"])
    .index("by_lab_score", ["labId", "score"]),

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
      v.literal("hire_complete")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    // Optional metadata
    taskId: v.optional(v.id("tasks")),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),
});

