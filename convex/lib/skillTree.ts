// Skill Tree - Level progression unlocks

export interface LevelUnlocks {
  level: number;
  xpRequired: number;
  queueSlots: number;
  parallelTasks: number;
  staffCapacity: number;
  computeUnits: number;
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
  | "parallel"
  | "staff"
  | "gpu"
  | "model"
  | "money"
  | "clan"
  | "leaderboard"
  | "research";

// XP required to reach each level
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
};

// Complete skill tree definition
export const SKILL_TREE: LevelUnlocks[] = [
  {
    level: 1,
    xpRequired: 0,
    queueSlots: 0,
    parallelTasks: 1,
    staffCapacity: 2,
    computeUnits: 1,
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
    queueSlots: 1,
    parallelTasks: 1,
    staffCapacity: 2,
    computeUnits: 1,
    unlocks: [
      {
        category: "capacity",
        name: "Task Queue",
        description: "Queue 1 task while another runs",
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
    queueSlots: 1,
    parallelTasks: 1,
    staffCapacity: 3,
    computeUnits: 2,
    unlocks: [
      {
        category: "social",
        name: "Clans",
        description: "Join or create a clan for +5% reputation",
        icon: "clan",
      },
      {
        category: "capacity",
        name: "+1 Staff Capacity",
        description: "Hire up to 3 researchers",
        icon: "staff",
      },
      {
        category: "infrastructure",
        name: "+1 Compute Unit",
        description: "2 GPUs available",
        icon: "gpu",
      },
    ],
  },
  {
    level: 4,
    xpRequired: 700,
    queueSlots: 2,
    parallelTasks: 1,
    staffCapacity: 3,
    computeUnits: 2,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Queue up to 2 tasks",
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
    queueSlots: 2,
    parallelTasks: 2,
    staffCapacity: 4,
    computeUnits: 2,
    unlocks: [
      {
        category: "capacity",
        name: "Parallel Processing",
        description: "Run 2 tasks simultaneously",
        icon: "parallel",
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
    queueSlots: 3,
    parallelTasks: 2,
    staffCapacity: 4,
    computeUnits: 3,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Queue up to 3 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 Compute Unit",
        description: "3 GPUs available",
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
    queueSlots: 3,
    parallelTasks: 2,
    staffCapacity: 5,
    computeUnits: 3,
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
    queueSlots: 4,
    parallelTasks: 3,
    staffCapacity: 5,
    computeUnits: 4,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Queue up to 4 tasks",
        icon: "queue",
      },
      {
        category: "capacity",
        name: "+1 Parallel Task",
        description: "Run 3 tasks simultaneously",
        icon: "parallel",
      },
      {
        category: "infrastructure",
        name: "+1 Compute Unit",
        description: "4 GPUs available",
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
    queueSlots: 4,
    parallelTasks: 3,
    staffCapacity: 6,
    computeUnits: 4,
    unlocks: [
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
    queueSlots: 5,
    parallelTasks: 3,
    staffCapacity: 6,
    computeUnits: 5,
    unlocks: [
      {
        category: "capacity",
        name: "+1 Queue Slot",
        description: "Queue up to 5 tasks",
        icon: "queue",
      },
      {
        category: "infrastructure",
        name: "+1 Compute Unit",
        description: "5 GPUs available",
        icon: "gpu",
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
  parallelTasks: number;
  staffCapacity: number;
  computeUnits: number;
} {
  const levelData = SKILL_TREE.find((l) => l.level === level);
  if (!levelData) {
    return { queueSlots: 0, parallelTasks: 1, staffCapacity: 2, computeUnits: 1 };
  }
  return {
    queueSlots: levelData.queueSlots,
    parallelTasks: levelData.parallelTasks,
    staffCapacity: levelData.staffCapacity,
    computeUnits: levelData.computeUnits,
  };
}

