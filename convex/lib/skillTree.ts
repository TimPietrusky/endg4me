// Skill Tree - RP-based perks (Research Speed, Money Multiplier)
// NOTE: Queue, Staff, Compute have moved to UP system (lib/game-config.ts)
// This file now only contains RP-purchasable perks

// =============================================================================
// PERK UPGRADES - Bonuses purchasable with RP
// =============================================================================

export type PerkType = 
  | "research_speed"
  | "money_multiplier"

export interface PerkNode {
  nodeId: string
  name: string
  description: string
  category: "perks"
  perkType: PerkType
  perkValue: number
  rpCost: number
  minLevel: number
  prerequisiteNodes: string[]
  unlockType: "perk"
  unlockTarget: string
  unlockDescription: string
}

// Base values at start (before any upgrades)
export const BASE_PERK_STATS = {
  researchSpeedBonus: 0,
  moneyMultiplier: 1.0,
}

// Perk upgrade definitions
// Research Speed and Money Multiplier remain as RP purchases
export const PERK_NODES: PerkNode[] = [
  // Research Speed - 5 tiers of +10% each (up to +50%)
  { nodeId: "speed_1", name: "+10% Research Speed", description: "Tasks complete 10% faster", category: "perks", perkType: "research_speed", perkValue: 10, rpCost: 400, minLevel: 3, prerequisiteNodes: [], unlockType: "perk", unlockTarget: "research_speed", unlockDescription: "+10% task speed" },
  { nodeId: "speed_2", name: "+10% Research Speed", description: "Tasks complete 20% faster", category: "perks", perkType: "research_speed", perkValue: 10, rpCost: 1500, minLevel: 6, prerequisiteNodes: ["speed_1"], unlockType: "perk", unlockTarget: "research_speed", unlockDescription: "+20% task speed" },
  { nodeId: "speed_3", name: "+10% Research Speed", description: "Tasks complete 30% faster", category: "perks", perkType: "research_speed", perkValue: 10, rpCost: 6000, minLevel: 10, prerequisiteNodes: ["speed_2"], unlockType: "perk", unlockTarget: "research_speed", unlockDescription: "+30% task speed" },
  { nodeId: "speed_4", name: "+10% Research Speed", description: "Tasks complete 40% faster", category: "perks", perkType: "research_speed", perkValue: 10, rpCost: 25000, minLevel: 14, prerequisiteNodes: ["speed_3"], unlockType: "perk", unlockTarget: "research_speed", unlockDescription: "+40% task speed" },
  { nodeId: "speed_5", name: "+10% Research Speed", description: "Tasks complete 50% faster", category: "perks", perkType: "research_speed", perkValue: 10, rpCost: 100000, minLevel: 18, prerequisiteNodes: ["speed_4"], unlockType: "perk", unlockTarget: "research_speed", unlockDescription: "+50% task speed" },

  // Money Multiplier - 5 tiers of +10% each (up to +50%)
  { nodeId: "money_1", name: "+10% Income", description: "All cash rewards increased by 10%", category: "perks", perkType: "money_multiplier", perkValue: 0.1, rpCost: 350, minLevel: 2, prerequisiteNodes: [], unlockType: "perk", unlockTarget: "money_multiplier", unlockDescription: "1.1x cash" },
  { nodeId: "money_2", name: "+10% Income", description: "All cash rewards increased by 20%", category: "perks", perkType: "money_multiplier", perkValue: 0.1, rpCost: 1200, minLevel: 5, prerequisiteNodes: ["money_1"], unlockType: "perk", unlockTarget: "money_multiplier", unlockDescription: "1.2x cash" },
  { nodeId: "money_3", name: "+10% Income", description: "All cash rewards increased by 30%", category: "perks", perkType: "money_multiplier", perkValue: 0.1, rpCost: 5000, minLevel: 9, prerequisiteNodes: ["money_2"], unlockType: "perk", unlockTarget: "money_multiplier", unlockDescription: "1.3x cash" },
  { nodeId: "money_4", name: "+10% Income", description: "All cash rewards increased by 40%", category: "perks", perkType: "money_multiplier", perkValue: 0.1, rpCost: 20000, minLevel: 13, prerequisiteNodes: ["money_3"], unlockType: "perk", unlockTarget: "money_multiplier", unlockDescription: "1.4x cash" },
  { nodeId: "money_5", name: "+10% Income", description: "All cash rewards increased by 50%", category: "perks", perkType: "money_multiplier", perkValue: 0.1, rpCost: 80000, minLevel: 17, prerequisiteNodes: ["money_4"], unlockType: "perk", unlockTarget: "money_multiplier", unlockDescription: "1.5x cash" },
]

// Re-export from central config
export { XP_PER_LEVEL as XP_REQUIREMENTS, MAX_LEVEL } from "./gameConfig"

// =============================================================================
// HELPERS
// =============================================================================

// Get all perk nodes for a specific perk type
export function getPerkNodes(type: PerkType): PerkNode[] {
  return PERK_NODES.filter(n => n.perkType === type)
}

// Get next available upgrade for a perk (based on purchased nodes)
export function getNextPerkUpgrade(
  type: PerkType, 
  purchasedNodeIds: Set<string>
): PerkNode | undefined {
  const nodes = getPerkNodes(type)
  return nodes.find(n => !purchasedNodeIds.has(n.nodeId))
}

// Calculate current value for a perk based on purchased upgrades
export function calculatePerkValue(
  type: PerkType,
  purchasedNodeIds: Set<string>
): number {
  const base = {
    research_speed: BASE_PERK_STATS.researchSpeedBonus,
    money_multiplier: BASE_PERK_STATS.moneyMultiplier,
  }[type]

  const nodes = getPerkNodes(type)
  let value = base

  for (const node of nodes) {
    if (purchasedNodeIds.has(node.nodeId)) {
      // Additive for both (money is now +0.1 per tier, not multiplicative)
      value += node.perkValue
    }
  }

  return value
}
