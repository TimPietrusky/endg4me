// Game constants based on planning doc

// Founder modifiers
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
} as const;

// Initial lab state
export const INITIAL_LAB_STATE = {
  cash: 5000,
  researchPoints: 0,
  reputation: 0,
  computeUnits: 1,
  staffCapacity: 2,
  parallelTasks: 1,
  juniorResearchers: 0,
};

// Initial player state
export const INITIAL_PLAYER_STATE = {
  level: 1,
  experience: 0,
};

// XP curve: level -> XP required for next level
export const XP_CURVE: Record<number, number> = {
  1: 100,
  2: 300,
  3: 700,
  4: 1500,
  5: 3300, // ~2.2x growth continues
  6: 7260,
  7: 15972,
  8: 35139,
  9: 77306,
  10: 170073,
};

// Task base reward type
export interface TaskBaseRewards {
  cash?: number;
  researchPoints?: number;
  reputation?: number;
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
    parallelTasksBonus?: number;
  };
  baseRewards: TaskBaseRewards;
  randomRange: { min: number; max: number };
}

// Task definitions
export const TASKS: Record<string, TaskConfig> = {
  train_small_model: {
    name: "Train Small Model (3B)",
    duration: 5 * 60 * 1000, // 5 minutes in ms
    cost: 500,
    computeRequired: 1,
    baseRewards: {
      researchPoints: 120,
      reputation: 5,
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
      reputation: 12,
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
      reputation: 2,
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
      parallelTasksBonus: 1, // +1 parallel task
    },
    baseRewards: {
      experience: 50,
    },
    randomRange: { min: 1.0, max: 1.0 },
  },
};

// Level rewards and unlocks
export const LEVEL_REWARDS = {
  globalEfficiencyPerLevel: 0.01, // +1% per level
  clanUnlockLevel: 3,
  // Queue system - unlocks progressively
  queueUnlocks: {
    2: 1, // Level 2: unlock queue with 1 slot
    4: 2, // Level 4: 2 queue slots
    6: 3, // Level 6: 3 queue slots
    8: 4, // Level 8: 4 queue slots
  } as Record<number, number>,
};

// Get queue slots for a level
export function getQueueSlotsForLevel(level: number): number {
  let slots = 0;
  for (const [unlockLevel, slotCount] of Object.entries(LEVEL_REWARDS.queueUnlocks)) {
    if (level >= parseInt(unlockLevel)) {
      slots = slotCount;
    }
  }
  return slots;
}

// Clan bonuses
export const CLAN_BONUS = {
  reputationGain: 1.05, // +5%
};

export type TaskType = "train_small_model" | "train_medium_model" | "freelance_contract" | "hire_junior_researcher";
export type FounderType = keyof typeof FOUNDER_MODIFIERS;

