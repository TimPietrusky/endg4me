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
  reputation: number
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
  reputationReward?: number
  xpReward?: number
  cashReward?: number
  speedBonus?: number
  parallelBonus?: number
  costReduction?: number
  cooldown?: number
  disabled?: boolean
  image?: string
  isRunning?: boolean
  remainingTime?: number
  isQueued?: boolean
}

export interface Notification {
  id: number
  type: "level_up" | "message" | "task_complete"
  title: string
  message: string
  timestamp: number
}

export type ViewType = "tasks" | "models" | "msgs"
