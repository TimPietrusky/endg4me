// Game constants based on planning doc
// NOTE: Core progression (XP, levels, UP, upgrades) in ./gameConfig.ts
// This file contains task/job definitions

import { FOUNDER_MODIFIERS, BASE_STATS } from "./gameConfig";

// Re-export for backwards compatibility
export { FOUNDER_MODIFIERS };

// Initial lab state
export const INITIAL_LAB_STATE = {
  cash: BASE_STATS.cash,
  researchPoints: BASE_STATS.researchPoints,
  juniorResearchers: 0,
};

// Initial player state
export const INITIAL_PLAYER_STATE = {
  level: 1,
  experience: 0,
  upgradePoints: 0,
  queueRank: 0,
  staffRank: 0,
  computeRank: 0,
};

// Task base reward type (reputation removed)
export interface TaskBaseRewards {
  cash?: number;
  researchPoints?: number;
  experience?: number;
}

export interface TaskConfig {
  name: string;
  duration: number;
  cost: number;
  computeRequired: number;
  cooldown?: number;
  staffCapacityRequired?: number;
  effects?: {
    researchSpeedBonus?: number;
    computeBonus?: number;
  };
  baseRewards: TaskBaseRewards;
  randomRange: { min: number; max: number };
}

// Task definitions (reputation rewards removed)
export const TASKS: Record<string, TaskConfig> = {
  train_small_model: {
    name: "Train Small Model (3B)",
    duration: 5 * 60 * 1000, // 5 minutes in ms
    cost: 500,
    computeRequired: 1,
    baseRewards: {
      researchPoints: 120,
      experience: 25,
    },
    randomRange: { min: 0.9, max: 1.1 },
  },
  train_medium_model: {
    name: "Train Medium Model (7B)",
    duration: 12 * 60 * 1000, // 12 minutes in ms
    cost: 1200,
    computeRequired: 1,
    baseRewards: {
      researchPoints: 260,
      experience: 60,
    },
    randomRange: { min: 0.85, max: 1.15 },
  },
  freelance_contract: {
    name: "Freelance AI Contract",
    duration: 3 * 60 * 1000, // 3 minutes in ms
    cost: 0,
    computeRequired: 0,
    cooldown: 5 * 60 * 1000, // 5 minutes cooldown
    baseRewards: {
      cash: 400,
      experience: 10,
    },
    randomRange: { min: 1.0, max: 1.0 }, // No randomness
  },
  hire_junior_researcher: {
    name: "Hire Junior Researcher",
    duration: 2 * 60 * 1000, // 2 minutes in ms
    cost: 2000,
    computeRequired: 0,
    staffCapacityRequired: 1,
    effects: {
      researchSpeedBonus: 0.1, // +10%
    },
    baseRewards: {
      experience: 50,
    },
    randomRange: { min: 1.0, max: 1.0 },
  },
};

// Level rewards and unlocks
// Note: Queue slots now come from UP upgrades, not level-based unlocks
export const LEVEL_REWARDS = {
  globalEfficiencyPerLevel: 0.01, // +1% per level
  clanUnlockLevel: 3,
};

// Clan bonuses (reputation removed, now grants XP bonus)
export const CLAN_BONUS = {
  xpGain: 1.05, // +5% XP
};

export type TaskType = "train_small_model" | "train_medium_model" | "freelance_contract" | "hire_junior_researcher";
export type FounderType = keyof typeof FOUNDER_MODIFIERS;

