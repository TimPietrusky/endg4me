// Skill Tree - Now represents purchasable RP upgrades, NOT automatic rewards
// Players choose how to spend RP on attributes and perks
// Level still exists but only gates access to certain nodes

// =============================================================================
// ATTRIBUTE UPGRADES - Global stats purchasable with RP
// =============================================================================

export type AttributeType = 
  | "queue_slots"
  | "staff_capacity"
  | "compute_units"
  | "research_speed"
  | "money_multiplier"

export interface AttributeNode {
  nodeId: string
  name: string
  description: string
  category: "attributes"
  attributeType: AttributeType
  attributeValue: number
  rpCost: number
  minLevel: number
  prerequisiteNodes: string[]
  unlockType: "attribute"
  unlockTarget: string
  unlockDescription: string
}

// Base values at start (before any upgrades)
export const BASE_STATS = {
  queueSlots: 1,
  staffCapacity: 1,
  computeUnits: 1,
  researchSpeedBonus: 0,
  moneyMultiplier: 1.0,
}

// Attribute upgrade definitions
// Each attribute has a progression of nodes with increasing costs
// Costs are balanced so early upgrades require some grinding
export const ATTRIBUTE_NODES: AttributeNode[] = [
  // Queue Slots - from 1 to 13 (12 upgrades)
  { nodeId: "queue_1", name: "+1 Queue Slot", description: "Run 2 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 200, minLevel: 1, prerequisiteNodes: [], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 2" },
  { nodeId: "queue_2", name: "+1 Queue Slot", description: "Run 3 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 500, minLevel: 3, prerequisiteNodes: ["queue_1"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 3" },
  { nodeId: "queue_3", name: "+1 Queue Slot", description: "Run 4 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 1200, minLevel: 5, prerequisiteNodes: ["queue_2"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 4" },
  { nodeId: "queue_4", name: "+1 Queue Slot", description: "Run 5 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 2500, minLevel: 7, prerequisiteNodes: ["queue_3"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 5" },
  { nodeId: "queue_5", name: "+1 Queue Slot", description: "Run 6 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 5000, minLevel: 9, prerequisiteNodes: ["queue_4"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 6" },
  { nodeId: "queue_6", name: "+1 Queue Slot", description: "Run 7 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 10000, minLevel: 11, prerequisiteNodes: ["queue_5"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 7" },
  { nodeId: "queue_7", name: "+1 Queue Slot", description: "Run 8 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 20000, minLevel: 13, prerequisiteNodes: ["queue_6"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 8" },
  { nodeId: "queue_8", name: "+1 Queue Slot", description: "Run 9 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 40000, minLevel: 15, prerequisiteNodes: ["queue_7"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 9" },
  { nodeId: "queue_9", name: "+1 Queue Slot", description: "Run 10 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 80000, minLevel: 17, prerequisiteNodes: ["queue_8"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 10" },
  { nodeId: "queue_10", name: "+1 Queue Slot", description: "Run 11 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 150000, minLevel: 18, prerequisiteNodes: ["queue_9"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 11" },
  { nodeId: "queue_11", name: "+1 Queue Slot", description: "Run 12 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 300000, minLevel: 19, prerequisiteNodes: ["queue_10"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 12" },
  { nodeId: "queue_12", name: "+1 Queue Slot", description: "Run 13 tasks in parallel", category: "attributes", attributeType: "queue_slots", attributeValue: 1, rpCost: 500000, minLevel: 20, prerequisiteNodes: ["queue_11"], unlockType: "attribute", unlockTarget: "queue_slots", unlockDescription: "Queue capacity: 13" },

  // Staff Capacity - from 1 to 12 (11 upgrades)
  { nodeId: "staff_1", name: "+1 Staff Capacity", description: "Hire up to 2 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 250, minLevel: 1, prerequisiteNodes: [], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 2" },
  { nodeId: "staff_2", name: "+1 Staff Capacity", description: "Hire up to 3 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 600, minLevel: 3, prerequisiteNodes: ["staff_1"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 3" },
  { nodeId: "staff_3", name: "+1 Staff Capacity", description: "Hire up to 4 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 1500, minLevel: 5, prerequisiteNodes: ["staff_2"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 4" },
  { nodeId: "staff_4", name: "+1 Staff Capacity", description: "Hire up to 5 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 3500, minLevel: 7, prerequisiteNodes: ["staff_3"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 5" },
  { nodeId: "staff_5", name: "+1 Staff Capacity", description: "Hire up to 6 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 7000, minLevel: 9, prerequisiteNodes: ["staff_4"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 6" },
  { nodeId: "staff_6", name: "+1 Staff Capacity", description: "Hire up to 7 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 15000, minLevel: 11, prerequisiteNodes: ["staff_5"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 7" },
  { nodeId: "staff_7", name: "+1 Staff Capacity", description: "Hire up to 8 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 30000, minLevel: 13, prerequisiteNodes: ["staff_6"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 8" },
  { nodeId: "staff_8", name: "+1 Staff Capacity", description: "Hire up to 9 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 60000, minLevel: 15, prerequisiteNodes: ["staff_7"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 9" },
  { nodeId: "staff_9", name: "+1 Staff Capacity", description: "Hire up to 10 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 120000, minLevel: 17, prerequisiteNodes: ["staff_8"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 10" },
  { nodeId: "staff_10", name: "+1 Staff Capacity", description: "Hire up to 11 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 250000, minLevel: 19, prerequisiteNodes: ["staff_9"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 11" },
  { nodeId: "staff_11", name: "+1 Staff Capacity", description: "Hire up to 12 researchers", category: "attributes", attributeType: "staff_capacity", attributeValue: 1, rpCost: 400000, minLevel: 20, prerequisiteNodes: ["staff_10"], unlockType: "attribute", unlockTarget: "staff_capacity", unlockDescription: "Staff capacity: 12" },

  // Compute Units (GPUs) - from 1 to 10 (9 upgrades)
  { nodeId: "cu_1", name: "+1 Compute Unit", description: "2 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 300, minLevel: 2, prerequisiteNodes: [], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 2 CU" },
  { nodeId: "cu_2", name: "+1 Compute Unit", description: "3 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 800, minLevel: 4, prerequisiteNodes: ["cu_1"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 3 CU" },
  { nodeId: "cu_3", name: "+1 Compute Unit", description: "4 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 2000, minLevel: 6, prerequisiteNodes: ["cu_2"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 4 CU" },
  { nodeId: "cu_4", name: "+1 Compute Unit", description: "5 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 5000, minLevel: 8, prerequisiteNodes: ["cu_3"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 5 CU" },
  { nodeId: "cu_5", name: "+1 Compute Unit", description: "6 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 12000, minLevel: 10, prerequisiteNodes: ["cu_4"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 6 CU" },
  { nodeId: "cu_6", name: "+1 Compute Unit", description: "7 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 25000, minLevel: 12, prerequisiteNodes: ["cu_5"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 7 CU" },
  { nodeId: "cu_7", name: "+1 Compute Unit", description: "8 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 50000, minLevel: 14, prerequisiteNodes: ["cu_6"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 8 CU" },
  { nodeId: "cu_8", name: "+1 Compute Unit", description: "9 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 100000, minLevel: 16, prerequisiteNodes: ["cu_7"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 9 CU" },
  { nodeId: "cu_9", name: "+1 Compute Unit", description: "10 GPUs for parallel training", category: "attributes", attributeType: "compute_units", attributeValue: 1, rpCost: 200000, minLevel: 18, prerequisiteNodes: ["cu_8"], unlockType: "attribute", unlockTarget: "compute_units", unlockDescription: "Compute: 10 CU" },

  // Research Speed - 5 tiers of +10% each (up to +50%)
  { nodeId: "speed_1", name: "+10% Research Speed", description: "Tasks complete 10% faster", category: "attributes", attributeType: "research_speed", attributeValue: 10, rpCost: 400, minLevel: 3, prerequisiteNodes: [], unlockType: "attribute", unlockTarget: "research_speed", unlockDescription: "+10% task speed" },
  { nodeId: "speed_2", name: "+10% Research Speed", description: "Tasks complete 20% faster", category: "attributes", attributeType: "research_speed", attributeValue: 10, rpCost: 1500, minLevel: 6, prerequisiteNodes: ["speed_1"], unlockType: "attribute", unlockTarget: "research_speed", unlockDescription: "+20% task speed" },
  { nodeId: "speed_3", name: "+10% Research Speed", description: "Tasks complete 30% faster", category: "attributes", attributeType: "research_speed", attributeValue: 10, rpCost: 6000, minLevel: 10, prerequisiteNodes: ["speed_2"], unlockType: "attribute", unlockTarget: "research_speed", unlockDescription: "+30% task speed" },
  { nodeId: "speed_4", name: "+10% Research Speed", description: "Tasks complete 40% faster", category: "attributes", attributeType: "research_speed", attributeValue: 10, rpCost: 25000, minLevel: 14, prerequisiteNodes: ["speed_3"], unlockType: "attribute", unlockTarget: "research_speed", unlockDescription: "+40% task speed" },
  { nodeId: "speed_5", name: "+10% Research Speed", description: "Tasks complete 50% faster", category: "attributes", attributeType: "research_speed", attributeValue: 10, rpCost: 100000, minLevel: 18, prerequisiteNodes: ["speed_4"], unlockType: "attribute", unlockTarget: "research_speed", unlockDescription: "+50% task speed" },

  // Money Multiplier - 5 tiers of +0.1x each (up to 1.5x)
  { nodeId: "money_1", name: "+10% Income", description: "All cash rewards increased by 10%", category: "attributes", attributeType: "money_multiplier", attributeValue: 1.1, rpCost: 350, minLevel: 2, prerequisiteNodes: [], unlockType: "attribute", unlockTarget: "money_multiplier", unlockDescription: "1.1x cash" },
  { nodeId: "money_2", name: "+10% Income", description: "All cash rewards increased by 20%", category: "attributes", attributeType: "money_multiplier", attributeValue: 1.1, rpCost: 1200, minLevel: 5, prerequisiteNodes: ["money_1"], unlockType: "attribute", unlockTarget: "money_multiplier", unlockDescription: "1.2x cash" },
  { nodeId: "money_3", name: "+10% Income", description: "All cash rewards increased by 30%", category: "attributes", attributeType: "money_multiplier", attributeValue: 1.1, rpCost: 5000, minLevel: 9, prerequisiteNodes: ["money_2"], unlockType: "attribute", unlockTarget: "money_multiplier", unlockDescription: "1.3x cash" },
  { nodeId: "money_4", name: "+10% Income", description: "All cash rewards increased by 40%", category: "attributes", attributeType: "money_multiplier", attributeValue: 1.1, rpCost: 20000, minLevel: 13, prerequisiteNodes: ["money_3"], unlockType: "attribute", unlockTarget: "money_multiplier", unlockDescription: "1.4x cash" },
  { nodeId: "money_5", name: "+10% Income", description: "All cash rewards increased by 50%", category: "attributes", attributeType: "money_multiplier", attributeValue: 1.1, rpCost: 80000, minLevel: 17, prerequisiteNodes: ["money_4"], unlockType: "attribute", unlockTarget: "money_multiplier", unlockDescription: "1.5x cash" },
]

// =============================================================================
// XP REQUIREMENTS - Level still exists for gating, just no automatic rewards
// =============================================================================

export const XP_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 700,
  5: 1500,
  6: 3300,
  7: 7260,
  8: 15972,
  9: 35139,
  10: 77306,
  11: 170073,
  12: 374160,
  13: 823152,
  14: 1810934,
  15: 3984055,
  16: 8764921,
  17: 19282826,
  18: 42422217,
  19: 93328878,
  20: 205323532, // ~2.2x previous level
}

// =============================================================================
// RP REWARDS PER LEVEL - Granted on level up
// =============================================================================

export const RP_REWARDS: Record<number, number> = {
  2: 100,
  3: 150,
  4: 250,
  5: 400,
  6: 600,
  7: 900,
  8: 1400,
  9: 2000,
  10: 3000,
  11: 4500,
  12: 7000,
  13: 10000,
  14: 15000,
  15: 22000,
  16: 33000,
  17: 50000,
  18: 75000,
  19: 110000,
  20: 200000,
}

// =============================================================================
// LEGACY - Keep for reference but these are now in ATTRIBUTE_NODES
// =============================================================================

export interface LevelUnlocks {
  level: number
  xpRequired: number
  queueSlots: number
  gpus: number
  staffCapacity: number
  unlocks: LevelUnlock[]
}

export interface LevelUnlock {
  category: UnlockCategory
  name: string
  description: string
  icon: UnlockIcon
}

export type UnlockCategory = 
  | "capacity"
  | "infrastructure" 
  | "research"
  | "income"
  | "social"

export type UnlockIcon =
  | "queue"
  | "staff"
  | "gpu"
  | "model"
  | "money"
  | "clan"
  | "leaderboard"
  | "research"

// DEPRECATED: Old automatic milestone system
// Keeping for reference but no longer used
export const SKILL_TREE: LevelUnlocks[] = []

// =============================================================================
// HELPERS
// =============================================================================

// Get all attribute nodes for a specific attribute type
export function getAttributeNodes(type: AttributeType): AttributeNode[] {
  return ATTRIBUTE_NODES.filter(n => n.attributeType === type)
}

// Get next available upgrade for an attribute (based on purchased nodes)
export function getNextAttributeUpgrade(
  type: AttributeType, 
  purchasedNodeIds: Set<string>
): AttributeNode | undefined {
  const nodes = getAttributeNodes(type)
  return nodes.find(n => !purchasedNodeIds.has(n.nodeId))
}

// Calculate current value for an attribute based on purchased upgrades
export function calculateAttributeValue(
  type: AttributeType,
  purchasedNodeIds: Set<string>
): number {
  const base = {
    queue_slots: BASE_STATS.queueSlots,
    staff_capacity: BASE_STATS.staffCapacity,
    compute_units: BASE_STATS.computeUnits,
    research_speed: BASE_STATS.researchSpeedBonus,
    money_multiplier: BASE_STATS.moneyMultiplier,
  }[type]

  const nodes = getAttributeNodes(type)
  let value = base

  for (const node of nodes) {
    if (purchasedNodeIds.has(node.nodeId)) {
      if (type === "money_multiplier") {
        // Multiplicative for money
        value = value * node.attributeValue
      } else {
        // Additive for everything else
        value += node.attributeValue
      }
    }
  }

  return value
}
