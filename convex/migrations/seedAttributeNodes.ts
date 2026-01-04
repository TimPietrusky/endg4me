import { mutation } from "../_generated/server"
import { ATTRIBUTE_NODES } from "../lib/skillTree"

// Seed the researchNodes table with attribute nodes
// Run once: npx convex run migrations/seedAttributeNodes:seed
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if nodes already exist
    const existing = await ctx.db
      .query("researchNodes")
      .filter(q => q.eq(q.field("category"), "attributes"))
      .first()

    if (existing) {
      return { success: false, message: "Attribute nodes already seeded" }
    }

    // Insert all attribute nodes
    let inserted = 0
    for (const node of ATTRIBUTE_NODES) {
      await ctx.db.insert("researchNodes", {
        nodeId: node.nodeId,
        name: node.name,
        description: node.description,
        category: node.category,
        rpCost: node.rpCost,
        minLevel: node.minLevel,
        prerequisiteNodes: node.prerequisiteNodes,
        unlockType: node.unlockType,
        unlockTarget: node.unlockTarget,
        unlockDescription: node.unlockDescription,
        attributeType: node.attributeType,
        attributeValue: node.attributeValue,
      })
      inserted++
    }

    return { success: true, inserted }
  },
})

// Clear all attribute nodes (for dev reset)
export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db
      .query("researchNodes")
      .filter(q => q.eq(q.field("category"), "attributes"))
      .collect()

    for (const node of nodes) {
      await ctx.db.delete(node._id)
    }

    return { deleted: nodes.length }
  },
})

// Reseed: clear and seed again
export const reseed = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing
    const nodes = await ctx.db
      .query("researchNodes")
      .filter(q => q.eq(q.field("category"), "attributes"))
      .collect()

    for (const node of nodes) {
      await ctx.db.delete(node._id)
    }

    // Insert fresh
    let inserted = 0
    for (const node of ATTRIBUTE_NODES) {
      await ctx.db.insert("researchNodes", {
        nodeId: node.nodeId,
        name: node.name,
        description: node.description,
        category: node.category,
        rpCost: node.rpCost,
        minLevel: node.minLevel,
        prerequisiteNodes: node.prerequisiteNodes,
        unlockType: node.unlockType,
        unlockTarget: node.unlockTarget,
        unlockDescription: node.unlockDescription,
        attributeType: node.attributeType,
        attributeValue: node.attributeValue,
      })
      inserted++
    }

    return { deleted: nodes.length, inserted }
  },
})

