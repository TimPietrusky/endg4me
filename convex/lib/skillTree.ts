// Skill Tree - Level progression unlocks (now called Milestones)
// Max level: 20

export interface LevelUnlocks {
  level: number;
  xpRequired: number;
  queueSlots: number;
  gpus: number;
  staffCapacity: number;
  unlocks: LevelUnlock[];
}

export interface LevelUnlock {
  category: UnlockCategory;
  name: string;
  description: string;
  icon: UnlockIcon;
}

export type UnlockCategory = 
  | "capacity"
  | "infrastructure" 
  | "research"
  | "income"
  | "social";

export type UnlockIcon =
  | "queue"
  | "staff"
  | "gpu"
  | "model"
  | "money"
  | "clan"
  | "leaderboard"
  | "research";

// XP required to reach each level (max 20)
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
  20: Infinity, // Max level
};

// Complete skill tree definition
export const SKILL_TREE: LevelUnlocks[] = [
  {
    level: 1,
    xpRequired: 0,
    queueSlots: 1,
    gpus: 1,
    staffCapacity: 2,
    unlocks: [
      {
        category: "research",
        name: "Small Model (3B)",
        description: "Train 3 billion parameter models",
        icon: "model",
      },
      {
        category: "income",
        name: "Freelance Contracts",
        description: "Basic income source",
        icon: "money",
      },
    ],
  },
  {
    level: 2,
    xpRequired: 100,
    queueSlots: 2,
    gpus: 1,
    staffCapacity: 2,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 2 tasks",
        icon: "queue",
      },
      {
        category: "research",
        name: "Medium Model (7B)",
        description: "Train 7 billion parameter models",
        icon: "model",
      },
    ],
  },
  {
    level: 3,
    xpRequired: 300,
    queueSlots: 2,
    gpus: 2,
    staffCapacity: 3,
    unlocks: [
      {
        category: "social",
        name: "Clans",
        description: "Join or create a clan for +5% XP bonus",
        icon: "clan",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 2 models simultaneously",
        icon: "gpu",
      },
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 3 researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 4,
    xpRequired: 700,
    queueSlots: 3,
    gpus: 2,
    staffCapacity: 3,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 3 tasks",
        icon: "queue",
      },
      {
        category: "research",
        name: "Large Model (13B)",
        description: "Train 13 billion parameter models",
        icon: "model",
      },
      {
        category: "capacity",
        name: "Senior Researcher",
        description: "Hire senior researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 5,
    xpRequired: 1500,
    queueSlots: 4,
    gpus: 2,
    staffCapacity: 4,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 4 tasks",
        icon: "queue",
      },
      {
        category: "social",
        name: "Weekly Leaderboard",
        description: "Compete in weekly rankings",
        icon: "leaderboard",
      },
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 4 researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 6,
    xpRequired: 3300,
    queueSlots: 5,
    gpus: 3,
    staffCapacity: 4,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 5 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 3 models simultaneously",
        icon: "gpu",
      },
      {
        category: "research",
        name: "XL Model (34B)",
        description: "Train 34 billion parameter models",
        icon: "model",
      },
    ],
  },
  {
    level: 7,
    xpRequired: 7260,
    queueSlots: 5,
    gpus: 3,
    staffCapacity: 5,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 5 researchers",
        icon: "staff",
      },
      {
        category: "income",
        name: "Government Contracts",
        description: "High-value government AI projects",
        icon: "money",
      },
      {
        category: "social",
        name: "Monthly Leaderboard",
        description: "Compete in monthly rankings",
        icon: "leaderboard",
      },
    ],
  },
  {
    level: 8,
    xpRequired: 15972,
    queueSlots: 6,
    gpus: 4,
    staffCapacity: 5,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 6 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 4 models simultaneously",
        icon: "gpu",
      },
      {
        category: "research",
        name: "XXL Model (70B)",
        description: "Train 70 billion parameter models",
        icon: "model",
      },
    ],
  },
  {
    level: 9,
    xpRequired: 35139,
    queueSlots: 7,
    gpus: 4,
    staffCapacity: 6,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 7 tasks",
        icon: "queue",
      },
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 6 researchers",
        icon: "staff",
      },
      {
        category: "income",
        name: "Research Partnerships",
        description: "Collaborate with other labs for bonus income",
        icon: "money",
      },
      {
        category: "social",
        name: "All-Time Leaderboard",
        description: "Compete for eternal glory",
        icon: "leaderboard",
      },
    ],
  },
  {
    level: 10,
    xpRequired: 77306,
    queueSlots: 8,
    gpus: 5,
    staffCapacity: 6,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 8 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 5 models simultaneously",
        icon: "gpu",
      },
    ],
  },
  {
    level: 11,
    xpRequired: 170073,
    queueSlots: 8,
    gpus: 5,
    staffCapacity: 7,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 7 researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 12,
    xpRequired: 374160,
    queueSlots: 9,
    gpus: 6,
    staffCapacity: 7,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 9 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 6 models simultaneously",
        icon: "gpu",
      },
      {
        category: "research",
        name: "Large Models Category",
        description: "Large model blueprints now visible",
        icon: "model",
      },
    ],
  },
  {
    level: 13,
    xpRequired: 823152,
    queueSlots: 9,
    gpus: 6,
    staffCapacity: 8,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 8 researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 14,
    xpRequired: 1810934,
    queueSlots: 10,
    gpus: 7,
    staffCapacity: 8,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 10 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 7 models simultaneously",
        icon: "gpu",
      },
    ],
  },
  {
    level: 15,
    xpRequired: 3984055,
    queueSlots: 10,
    gpus: 7,
    staffCapacity: 9,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 9 researchers",
        icon: "staff",
      },
      {
        category: "research",
        name: "XL Model (34B)",
        description: "Train 34 billion parameter models",
        icon: "model",
      },
    ],
  },
  {
    level: 16,
    xpRequired: 8764921,
    queueSlots: 11,
    gpus: 8,
    staffCapacity: 9,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 11 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 8 models simultaneously",
        icon: "gpu",
      },
    ],
  },
  {
    level: 17,
    xpRequired: 19282826,
    queueSlots: 11,
    gpus: 8,
    staffCapacity: 10,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 10 researchers",
        icon: "staff",
      },
    ],
  },
  {
    level: 18,
    xpRequired: 42422217,
    queueSlots: 12,
    gpus: 9,
    staffCapacity: 10,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 12 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 9 models simultaneously",
        icon: "gpu",
      },
      {
        category: "research",
        name: "XXL Model (70B)",
        description: "Train 70 billion parameter models",
        icon: "model",
      },
    ],
  },
  {
    level: 19,
    xpRequired: 93328878,
    queueSlots: 12,
    gpus: 9,
    staffCapacity: 11,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 11 researchers",
        icon: "staff",
      },
      {
        category: "social",
        name: "All-Time Leaderboard",
        description: "Compete for eternal glory",
        icon: "leaderboard",
      },
    ],
  },
  {
    level: 20,
    xpRequired: Infinity,
    queueSlots: 13,
    gpus: 10,
    staffCapacity: 12,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Run or queue up to 13 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 GPU",
        description: "Train 10 models simultaneously",
        icon: "gpu",
      },
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 12 researchers",
        icon: "staff",
      },
      {
        category: "research",
        name: "Frontier Model (405B)",
        description: "Train 405 billion parameter models",
        icon: "model",
      },
      {
        category: "research",
        name: "AGI Research",
        description: "Begin the path to AGI",
        icon: "research",
      },
    ],
  },
];

// Helper: get unlocks for a specific level
export function getLevelData(level: number): LevelUnlocks | undefined {
  return SKILL_TREE.find((l) => l.level === level);
}

// Helper: get all unlocks up to and including a level
export function getUnlocksUpToLevel(level: number): LevelUnlock[] {
  return SKILL_TREE
    .filter((l) => l.level <= level)
    .flatMap((l) => l.unlocks);
}

// Helper: check if a specific unlock is available at level
export function hasUnlock(level: number, unlockName: string): boolean {
  const unlocks = getUnlocksUpToLevel(level);
  return unlocks.some((u) => u.name === unlockName);
}

// Helper: get capacity values for a level
export function getCapacityForLevel(level: number): {
  queueSlots: number;
  gpus: number;
  staffCapacity: number;
} {
  const levelData = SKILL_TREE.find((l) => l.level === level);
  if (!levelData) {
    return { queueSlots: 1, gpus: 1, staffCapacity: 2 };
  }
  return {
    queueSlots: levelData.queueSlots,
    gpus: levelData.gpus,
    staffCapacity: levelData.staffCapacity,
  };
}
