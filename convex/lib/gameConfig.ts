// =============================================================================
// GAME CONFIG - Central source of truth for all game constants
// Location: convex/lib/ so both Convex functions and frontend can import
// Frontend imports: @/convex/lib/gameConfig
// Convex imports: ./lib/gameConfig
// =============================================================================

// -----------------------------------------------------------------------------
// LEVEL SYSTEM
// -----------------------------------------------------------------------------

export const MAX_LEVEL = 20

export const UP_PER_LEVEL = 1

// XP required to advance FROM each level TO the next
// e.g., XP_PER_LEVEL[1] = 100 means you need 100 XP to go from level 1 to level 2
// XP resets to 0 when leveling up (excess carries over)
export const XP_PER_LEVEL: Record<number, number> = {
  1: 100,
  2: 120,
  3: 140,
  4: 160,
  5: 180,
  6: 200,
  7: 220,
  8: 240,
  9: 260,
  10: 280,
  11: 300,
  12: 320,
  13: 340,
  14: 360,
  15: 380,
  16: 400,
  17: 420,
  18: 440,
  19: 460,
  20: Infinity, // Max level, can't level up further
}

// -----------------------------------------------------------------------------
// UPGRADE POINTS (UP) SYSTEM
// -----------------------------------------------------------------------------

export type UpgradeType = "queue" | "staff" | "compute"

export interface UpgradeDefinition {
  id: UpgradeType
  name: string
  description: string
  base: number
  perRank: number
  maxRank: number
  unit: string
}

export const LAB_UPGRADES: Record<UpgradeType, UpgradeDefinition> = {
  queue: {
    id: "queue",
    name: "Queue Capacity",
    description: "Max concurrent jobs",
    base: 1,
    perRank: 1,
    maxRank: 8,
    unit: "slots",
  },
  staff: {
    id: "staff",
    name: "Team Size", 
    description: "Max active team members",
    base: 1,
    perRank: 1,
    maxRank: 6,
    unit: "seats",
  },
  compute: {
    id: "compute",
    name: "Compute",
    description: "Compute units for parallel training",
    base: 1,
    perRank: 1,
    maxRank: 10,
    unit: "CU",
  },
}

// Level-gated rank availability
// Defines which ranks are unlocked at which player levels
export const RANK_LEVEL_GATES: { minRank: number; maxRank: number; requiredLevel: number }[] = [
  { minRank: 0, maxRank: 2, requiredLevel: 1 },
  { minRank: 3, maxRank: 4, requiredLevel: 6 },
  { minRank: 5, maxRank: 6, requiredLevel: 11 },
  { minRank: 7, maxRank: 10, requiredLevel: 16 },
]

// -----------------------------------------------------------------------------
// BASE STATS (Starting values before any upgrades)
// -----------------------------------------------------------------------------

export const BASE_STATS = {
  cash: 1000,
  researchPoints: 0,
}

// -----------------------------------------------------------------------------
// FOUNDER MODIFIERS
// -----------------------------------------------------------------------------

export const FOUNDER_MODIFIERS = {
  technical: {
    researchSpeed: 1.25, // +25%
    modelScore: 1.1, // +10%
    moneyRewards: 0.8, // -20%
    hiringSpeed: 1.0,
  },
  business: {
    researchSpeed: 0.8, // -20%
    modelScore: 1.0,
    moneyRewards: 1.3, // +30%
    hiringSpeed: 1.2, // +20%
  },
} as const

export type FounderType = keyof typeof FOUNDER_MODIFIERS

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Get the value of an upgrade at a specific rank
 */
export function getUpgradeValue(type: UpgradeType, rank: number): number {
  const upgrade = LAB_UPGRADES[type]
  return upgrade.base + upgrade.perRank * rank
}

/**
 * Get the required level to unlock a specific rank
 */
export function getRequiredLevelForRank(rank: number): number {
  for (const gate of RANK_LEVEL_GATES) {
    if (rank >= gate.minRank && rank <= gate.maxRank) {
      return gate.requiredLevel
    }
  }
  // Default to max level if rank exceeds defined gates
  return MAX_LEVEL
}

/**
 * Check if a rank is unlocked for a player at a given level
 */
export function isRankUnlocked(rank: number, playerLevel: number): boolean {
  return playerLevel >= getRequiredLevelForRank(rank)
}

/**
 * Get the max rank a player can currently purchase based on their level
 */
export function getMaxAvailableRank(playerLevel: number): number {
  let maxRank = 0
  for (const gate of RANK_LEVEL_GATES) {
    if (playerLevel >= gate.requiredLevel) {
      maxRank = gate.maxRank
    }
  }
  return maxRank
}

/**
 * Get XP required to level up from the current level
 * XP resets to 0 when leveling up
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return Infinity
  return XP_PER_LEVEL[currentLevel] ?? Infinity
}

/**
 * Get total UP available at a given level
 */
export function getTotalUpAtLevel(level: number): number {
  // Level 1 = 0 UP (haven't leveled up yet)
  // Level 2 = 1 UP (from leveling to 2)
  // Level 20 = 19 UP (from leveling 2-20)
  return Math.max(0, level - 1) * UP_PER_LEVEL
}

