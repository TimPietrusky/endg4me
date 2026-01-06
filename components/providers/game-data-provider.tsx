"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { getJobById, JOB_DEFS } from "@/convex/lib/contentCatalog"
import { getUpgradeValue, getXpForNextLevel, FOUNDER_BONUSES, type FounderType } from "@/convex/lib/gameConfig"
import { useToast } from "@/hooks/use-toast"
import type { Action, Notification } from "@/lib/game-types"

interface GameData {
  // Core data
  user: Doc<"users"> | null
  lab: Doc<"labs"> | null
  labState: Doc<"labState"> | null
  playerState: Doc<"playerState"> | null
  userId: string | null
  
  // Derived data (from UP ranks)
  xpRequired: number
  maxParallelTasks: number
  activeTaskCount: number
  isQueueFull: boolean
  availableGpus: number
  usedCompute: number
  queueCapacity: number
  staffCapacity: number
  computeCapacity: number
  upgradePoints: number
  
  // Lists
  actions: Action[]
  notifications: Notification[]
  trainedModels: Doc<"trainedModels">[] | undefined
  modelStats: {
    totalModels: number
    llmModels: number
    ttsModels: number
    vlmModels: number
    publicModels: number
    totalScore: number
    averageScore: number
    bestModel: Doc<"trainedModels"> | null
  } | undefined
  
  // Counts
  unreadCount: number
  publicModelCount: number
  privateModelCount: number
  
  // Actions
  handleStartAction: (action: Action) => Promise<void>
  handleMarkAsRead: (id: string | number) => Promise<void>
  
  // Loading state
  isLoading: boolean
  needsFounderSelection: boolean
}

const GameDataContext = createContext<GameData | null>(null)

export function useGameData() {
  const context = useContext(GameDataContext)
  if (!context) {
    throw new Error("useGameData must be used within GameDataProvider")
  }
  return context
}

// Job image mapping
const JOB_IMAGES: Record<string, string> = {
  "job_train_tts_3b": "/ai-neural-network-training-blue-glow.jpg",
  "job_train_vlm_7b": "/advanced-ai-training-purple-cyber.jpg",
  "job_train_llm_3b": "/ai-neural-network-training-blue-glow.jpg",
  "job_train_llm_17b": "/massive-ai-datacenter-training.jpg",
  "job_contract_blog_basic": "/cyberpunk-freelance-coding-terminal.jpg",
  "job_contract_voice_pack": "/cyberpunk-freelance-coding-terminal.jpg",
  "job_contract_image_qa": "/cyberpunk-freelance-coding-terminal.jpg",
  "job_research_literature": "/server-optimization-tech-infrastructure.jpg",
}

interface GameDataProviderProps {
  children: ReactNode
  workosUserId: string
}

export function GameDataProvider({ children, workosUserId }: GameDataProviderProps) {
  const { toast } = useToast()

  // First get the Convex user from WorkOS ID
  const convexUser = useQuery(
    api.users.getCurrentUser,
    workosUserId ? { workosUserId } : "skip"
  )
  
  // Extract Convex user ID
  const userId = convexUser?._id ?? null

  // Core queries - using Convex user ID
  const labData = useQuery(
    api.labs.getFullLabData,
    userId ? { userId } : "skip"
  )

  const activeTasks = useQuery(
    api.tasks.getActiveTasks,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )

  const recentActivity = useQuery(
    api.notifications.getRecentActivity,
    userId ? { userId, limit: 20 } : "skip"
  )

  const modelStats = useQuery(
    api.tasks.getModelStats,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )

  const trainedModels = useQuery(
    api.tasks.getTrainedModels,
    labData?.lab ? { labId: labData.lab._id, limit: 50 } : "skip"
  )

  // Training history for showing version info on action cards
  const trainingHistory = useQuery(
    api.tasks.getTrainingHistory,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )

  // Get available jobs with unlock status
  const availableJobs = useQuery(
    api.tasks.getAvailableJobs,
    labData?.lab && userId
      ? { userId, labId: labData.lab._id }
      : "skip"
  )

  // Mutations
  const startJob = useMutation(api.tasks.startJob)
  const markNotificationRead = useMutation(api.notifications.markAsRead)

  // Re-render every second for task timers
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Extract data
  const user = labData?.user ?? null
  const lab = labData?.lab ?? null
  const labState = labData?.labState ?? null
  const playerState = labData?.playerState ?? null

  // Derived calculations
  const xpRequired = playerState ? getXpForNextLevel(playerState.level) : 100
  
  // Extract tasks and effectiveNow from the query result (supports Time Warp)
  const taskData = activeTasks as { tasks: typeof activeTasks; effectiveNow: number } | undefined
  const allActiveTasks = taskData?.tasks || []
  const effectiveNow = taskData?.effectiveNow || Date.now()
  
  const inProgressTasks = allActiveTasks.filter((t) => t.status === "in_progress") || []
  const queuedTasks = allActiveTasks.filter((t) => t.status === "queued") || []
  
  // Compute values from UP-based ranks (playerState)
  const queueCapacity = playerState ? getUpgradeValue("queue", playerState.queueRank ?? 0) : 1
  const staffCapacity = playerState ? getUpgradeValue("staff", playerState.staffRank ?? 0) : 0
  const computeCapacity = playerState ? getUpgradeValue("compute", playerState.computeRank ?? 0) : 1
  
  // Queue slots = base queue capacity + junior researchers (each adds 1 slot)
  const maxParallelTasks = queueCapacity + (labState?.juniorResearchers || 0)
  const activeTaskCount = inProgressTasks.length
  const isQueueFull = activeTaskCount >= maxParallelTasks
  
  // Calculate used compute from active tasks
  const usedCompute = inProgressTasks.reduce((sum, task) => {
    const jobDef = getJobById(task.type)
    return sum + (jobDef?.computeRequiredCU ?? 0)
  }, 0)
  const availableGpus = computeCapacity - usedCompute

  // Helper to get remaining time for a job (uses effectiveNow for Time Warp support)
  function getJobRemainingTime(jobId: string): number | undefined {
    const task = inProgressTasks.find((t) => t.type === jobId)
    if (task?.completesAt) {
      return Math.max(0, Math.floor((task.completesAt - effectiveNow) / 1000))
    }
    return undefined
  }

  // Helper to get speed factor for active jobs (original duration / actual duration)
  function getJobSpeedFactor(jobId: string): number {
    const task = inProgressTasks.find((t) => t.type === jobId)
    const jobDef = getJobById(jobId)
    if (task?.startedAt && task?.completesAt && jobDef) {
      const originalDuration = jobDef.durationMs / 1000
      const actualDuration = (task.completesAt - task.startedAt) / 1000
      if (actualDuration > 0) {
        return originalDuration / actualDuration
      }
    }
    return 1
  }

  // Calculate total bonuses from all sources (founder, UP ranks, active hires)
  // NOTE: This must be before getJobDisabledInfo so it can use the adjusted costs
  const founderType = lab?.founderType as FounderType | undefined
  const founderBonuses = founderType ? FOUNDER_BONUSES[founderType] : {}
  
  // Speed bonus: founder + UP ranks + RP perks + active hires
  const founderSpeedBonus = founderBonuses.speed ?? 0
  const upSpeedBonus = playerState ? getUpgradeValue("speed", playerState.speedRank ?? 0) : 0
  const rpSpeedBonus = labState?.speedBonus ?? 0
  
  // Money multiplier: base 100% + founder + UP ranks + RP perks + active hires
  // NOTE: labState.moneyMultiplier is stored as a multiplier (1.0, 1.1, etc.), not percentage
  const baseMoneyMultiplier = 100
  const founderMoneyBonus = founderBonuses.moneyMultiplier ?? 0
  const upMoneyBonus = playerState ? getUpgradeValue("moneyMultiplier", playerState.moneyMultiplierRank ?? 0) - 100 : 0 // subtract base since we add it
  const rpMoneyBonus = labState?.moneyMultiplier && labState.moneyMultiplier > 1 
    ? (labState.moneyMultiplier - 1) * 100 // Convert 1.1 to 10%
    : 0
  
  // Calculate active hire bonuses from in-progress hire tasks
  let hireSpeedBonus = 0
  let hireMoneyBonus = 0
  for (const task of inProgressTasks) {
    const jobDef = getJobById(task.type)
    if (jobDef?.category === "hire" && jobDef.output) {
      const output = jobDef.output as { hireStat?: string; hireBonus?: number }
      if (output.hireStat === "speed") {
        hireSpeedBonus += output.hireBonus ?? 0
      } else if (output.hireStat === "moneyMultiplier") {
        hireMoneyBonus += output.hireBonus ?? 0
      }
    }
  }
  
  // Total bonuses
  const totalSpeedBonus = founderSpeedBonus + upSpeedBonus + rpSpeedBonus + hireSpeedBonus
  const totalMoneyMultiplier = baseMoneyMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus
  
  // Helper to adjust duration based on speed bonus (hire jobs are NOT affected)
  function getAdjustedDuration(jobDef: { durationMs: number; category: string }): number {
    if (jobDef.category === "hire") {
      // Hire jobs have fixed duration
      return Math.floor(jobDef.durationMs / 1000)
    }
    // Apply speed bonus: duration / (1 + bonus/100)
    const adjustedMs = jobDef.durationMs / (1 + totalSpeedBonus / 100)
    return Math.floor(adjustedMs / 1000)
  }
  
  // Helper to adjust money reward based on multiplier (income goes UP)
  function getAdjustedCashReward(baseReward: number): number {
    if (baseReward <= 0) return 0
    return Math.floor(baseReward * (totalMoneyMultiplier / 100))
  }
  
  // Helper to adjust money cost based on multiplier (costs go DOWN)
  function getAdjustedCost(baseCost: number): number {
    if (baseCost <= 0) return 0
    return Math.floor(baseCost / (totalMoneyMultiplier / 100))
  }

  // Helper to check job disabled status (uses adjusted costs)
  function getJobDisabledInfo(jobId: string) {
    const jobDef = getJobById(jobId)
    if (!jobDef || !labState) {
      return { disabled: true, reason: "loading" }
    }

    // Calculate adjusted cost
    const adjustedCost = getAdjustedCost(jobDef.moneyCost)

    // Check all conditions and collect all shortfalls
    let fundsShortfall = 0
    let gpuShortfall = 0
    const reasons: string[] = []

    // Check funds (using adjusted cost)
    if (labState.cash < adjustedCost) {
      fundsShortfall = adjustedCost - labState.cash
      reasons.push("not enough funds")
    }

    // Check compute
    if (jobDef.computeRequiredCU > 0 && availableGpus < jobDef.computeRequiredCU) {
      gpuShortfall = jobDef.computeRequiredCU - availableGpus
      reasons.push("not enough CU")
    }

    // Check queue
    if (isQueueFull) {
      reasons.push("queue full")
    }

    // Return combined result
    if (reasons.length > 0) {
      return { 
        disabled: true, 
        reason: reasons.join(", "),
        fundsShortfall,
        gpuShortfall
      }
    }

    return { disabled: false }
  }

  // Build actions from available jobs
  // Only show training and contract jobs in Operate (no research jobs)
  const actions: Action[] = (availableJobs || [])
    .filter((job) => {
      if (!job.isUnlocked) return false
      const jobDef = getJobById(job.jobId)
      // Filter out research jobs - those belong in the Research tab
      return jobDef && jobDef.category !== "research"
    })
    .map((job) => {
      const jobDef = getJobById(job.jobId)
      if (!jobDef) return null

      const disabledInfo = getJobDisabledInfo(job.jobId)
      const isActive = inProgressTasks.some((t) => t.type === job.jobId)
      const isQueued = queuedTasks.some((t) => t.type === job.jobId)

      // Determine display category for Operate
      let category: "TRAINING" | "REVENUE" | "HIRING" = "TRAINING"
      if (jobDef.category === "contract" || jobDef.category === "revenue") category = "REVENUE"
      if (jobDef.category === "hire") category = "HIRING"

      // Get model size from name if training job
      let size: string | undefined
      if (jobDef.category === "training") {
        const match = jobDef.name.match(/(\d+B)/)
        size = match ? match[1] : undefined
      }

      // Short name for display
      let displayName = jobDef.name
      if (jobDef.category === "training") {
        // Extract model type (TTS, VLM, LLM) from name
        if (jobDef.name.includes("TTS")) displayName = "TTS"
        else if (jobDef.name.includes("VLM")) displayName = "VLM"
        else if (jobDef.name.includes("LLM")) displayName = jobDef.name.includes("17B") ? "LLM 17B" : "LLM 3B"
      }

      // Get training history for this job's blueprint (if training job)
      const blueprintId = jobDef.output.trainsBlueprintId
      const history = blueprintId && trainingHistory ? trainingHistory[blueprintId] : undefined

      // Calculate adjusted values based on current bonuses
      const adjustedDuration = getAdjustedDuration(jobDef)
      const adjustedCashReward = getAdjustedCashReward(jobDef.rewards.money || 0)
      const adjustedCost = getAdjustedCost(jobDef.moneyCost)

      return {
        id: job.jobId,
        category,
        name: displayName,
        description: jobDef.description,
        size,
        cost: adjustedCost,
        gpuCost: jobDef.computeRequiredCU,
        duration: adjustedDuration,
        rpReward: jobDef.rewards.rp || undefined,
        xpReward: jobDef.rewards.xp || undefined,
        cashReward: adjustedCashReward || undefined,
        disabled: disabledInfo.disabled,
        disabledReason: disabledInfo.reason,
        fundsShortfall: disabledInfo.fundsShortfall || 0,
        gpuShortfall: disabledInfo.gpuShortfall || 0,
        image: JOB_IMAGES[job.jobId] || "/server-optimization-tech-infrastructure.jpg",
        isActive,
        remainingTime: getJobRemainingTime(job.jobId),
        speedFactor: isActive ? getJobSpeedFactor(job.jobId) : 1,
        isQueued,
        locked: false,
        // Training history
        latestVersion: history?.latestVersion,
        versionCount: history?.versionCount,
        bestScore: history?.bestScore,
      } as Action
    })
    .filter((a): a is Action => a !== null)

  // Notifications
  const notifications: Notification[] = (recentActivity || []).map((n) => ({
    id: n._id,
    type: n.type as Notification["type"],
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
    read: n.read,
    deepLink: n.deepLink as Notification["deepLink"],
  }))

  // Model counts
  const publicModelCount = trainedModels?.filter((m) => m.visibility === "public").length || 0
  const privateModelCount = trainedModels?.filter((m) => m.visibility !== "public").length || 0

  // Action handlers
  const handleStartAction = async (action: Action) => {
    if (!lab) return

    try {
      await startJob({ labId: lab._id, jobId: action.id })
      toast({
        title: "Job Started",
        description: `${action.name} is now in progress`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      toast({
        title: "Failed to start job",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await markNotificationRead({ notificationId: id as Id<"notifications"> })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const value: GameData = {
    user,
    lab,
    labState,
    playerState,
    userId,
    xpRequired,
    maxParallelTasks,
    activeTaskCount,
    isQueueFull,
    availableGpus,
    usedCompute,
    queueCapacity,
    staffCapacity,
    computeCapacity,
    upgradePoints: playerState?.upgradePoints ?? 0,
    actions,
    notifications,
    trainedModels,
    modelStats,
    unreadCount: notifications.filter((n) => !n.read).length,
    publicModelCount,
    privateModelCount,
    handleStartAction,
    handleMarkAsRead,
    isLoading: !labData,
    needsFounderSelection: !!labData && !labData.lab,
  }

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  )
}
