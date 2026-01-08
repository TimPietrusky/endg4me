export interface GameState {
  playerName: string
  labName?: string
  playerLevel?: number
  level: number
  xp: number
  maxXp: number
  cash: number
  rp: number
  researchPoints?: number
  role: string
  founderType?: string
  modelsTrained: number
  researchers: number
  taskQueue: number
  staffCount?: { current: number }
  queueSlots?: number
}

export interface Action {
  id: string
  category: string
  name: string
  description: string
  size?: string
  cost: number
  duration: number
  rpReward?: number
  xpReward?: number
  cashReward?: number
  speedBonus?: number
  speedFactor?: number // How much faster the job runs (1.25 = 25% faster)
  gpuBonus?: number
  gpuCost?: number
  costReduction?: number
  cooldown?: number
  disabled?: boolean
  disabledReason?: string
  fundsShortfall?: number
  gpuShortfall?: number
  rpShortfall?: number // RP shortfall for research actions
  image?: string
  depthImage?: string
  modelUrl?: string
  isActive?: boolean
  remainingTime?: number
  isQueued?: boolean
  // Unlock gating
  locked?: boolean
  lockReason?: string
  unlockLink?: { view: ViewType; target?: string }
  // Training history (for retrain UI)
  latestVersion?: number
  versionCount?: number
  bestScore?: number
  // Research-specific fields
  rpCost?: number // RP cost for research actions
  completed?: boolean // Whether this research/action is completed/unlocked
  minLevel?: number // Minimum level requirement
  prerequisiteCount?: number // Number of prerequisites
  prerequisiteId?: string // ID of prerequisite node
  prerequisiteName?: string // Display name of prerequisite node
  levelShortfall?: number // How many levels needed (e.g., need 5, have 3 = 2)
  // Expandable versions (for Lab Models)
  versions?: ActionVersion[]
  publicCount?: number // Number of public versions
}

export interface ActionVersion {
  id: string
  version: number
  score: number
  trainedAt: number
  isBest: boolean
}

export interface Notification {
  id: number | string
  type: "level_up" | "message" | "task_complete" | "unlock" | "hire_complete" | "research_complete"
  title: string
  message: string
  timestamp: number
  read: boolean
  deepLink?: { view: ViewType; target?: string }
}

// 5-tab navigation: operate / research / lab / inbox / leaderboard
export type ViewType = "operate" | "research" | "lab" | "inbox" | "leaderboard"

