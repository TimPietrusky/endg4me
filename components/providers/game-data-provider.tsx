"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { getContentById, getContentImageUrl, getAssetBySlug, type ContentEntry } from "@/convex/lib/contentCatalog"
import { getUpgradeValue, getXpForNextLevel, FOUNDER_BONUSES, type FounderType } from "@/convex/lib/gameConfig"
import { useToast } from "@/hooks/use-toast"
import type { Action, ActionRequirement, Notification } from "@/lib/game-types"

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

// Get content images - prefer entity asset, fallback to category defaults
function getContentImages(content: ContentEntry | undefined): { image: string; depthImage?: string; modelUrl?: string } {
  if (!content) return { image: "/server-optimization-tech-infrastructure.jpg" }
  
  // Check if content has an asset
  if (content.assetSlug) {
    const asset = getAssetBySlug(content.assetSlug)
    if (asset?.files.image) {
      return {
        image: asset.files.image,
        depthImage: asset.files.depth,
        modelUrl: asset.files.model,
      }
    }
  }
  
  // Fallback by content type
  switch (content.contentType) {
    case "model":
      return { image: "/ai-neural-network-training-blue-glow.jpg" }
    case "contract":
    case "income":
      return { image: "/cyberpunk-freelance-coding-terminal.jpg" }
    case "hire":
      return { image: "/cyberpunk-freelance-coding-terminal.jpg" }
    default:
      return { image: "/server-optimization-tech-infrastructure.jpg" }
  }
}

interface GameDataProviderProps {
  children: ReactNode
  workosUserId: string
}

export function GameDataProvider({ children, workosUserId }: GameDataProviderProps) {
  const { toast } = useToast()
  
  // Track Convex user ID after ensuring user exists
  const [convexUserId, setConvexUserId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Ensure Convex user exists on mount (creates if missing)
  useEffect(() => {
    if (!workosUserId) {
      setIsInitializing(false)
      return
    }
    
    async function ensureUser() {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          const data = await res.json()
          setConvexUserId(data.convexUserId)
        }
      } catch (error) {
        console.error("Failed to ensure user:", error)
      } finally {
        setIsInitializing(false)
      }
    }
    
    ensureUser()
  }, [workosUserId])
  
  // Use the ensured Convex user ID
  const userId = convexUserId as Id<"users"> | null

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

  // Current client time for countdown calculations
  // This updates every second to drive the timer display
  const [clientNow, setClientNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setClientNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Extract data
  const user = labData?.user ?? null
  const lab = labData?.lab ?? null
  const labState = labData?.labState ?? null
  const playerState = labData?.playerState ?? null

  // Derived calculations
  const xpRequired = playerState ? getXpForNextLevel(playerState.level) : 100
  
  // Extract tasks from the query result
  const allActiveTasks = activeTasks?.tasks || []
  
  const inProgressTasks = allActiveTasks.filter((t) => t.status === "in_progress")
  const queuedTasks = allActiveTasks.filter((t) => t.status === "queued")
  
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
    const content = getContentById(task.type)
    return sum + (content?.jobComputeCost ?? 0)
  }, 0)
  const availableGpus = computeCapacity - usedCompute

  // Helper to get remaining time for a job
  // Uses clientNow (updates every second) to calculate actual remaining time
  function getJobRemainingTime(jobId: string): number | undefined {
    const task = inProgressTasks.find((t) => t.type === jobId)
    if (task?.completesAt) {
      return Math.max(0, Math.floor((task.completesAt - clientNow) / 1000))
    }
    return undefined
  }

  // Helper to get speed factor for active jobs (original duration / actual duration)
  function getJobSpeedFactor(jobId: string): number {
    const task = inProgressTasks.find((t) => t.type === jobId)
    const content = getContentById(jobId)
    if (task?.startedAt && task?.completesAt && content?.jobDurationMs) {
      const originalDuration = content.jobDurationMs / 1000
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
    const content = getContentById(task.type)
    if (content?.contentType === "hire" && content.hireStat && content.hireBonus) {
      if (content.hireStat === "speed") {
        hireSpeedBonus += content.hireBonus
      } else if (content.hireStat === "moneyMultiplier") {
        hireMoneyBonus += content.hireBonus
      }
    }
  }
  
  // Total bonuses
  const totalSpeedBonus = founderSpeedBonus + upSpeedBonus + rpSpeedBonus + hireSpeedBonus
  const totalMoneyMultiplier = baseMoneyMultiplier + founderMoneyBonus + upMoneyBonus + rpMoneyBonus + hireMoneyBonus
  
  // Helper to adjust duration based on all speed modifiers (must match backend calculation)
  // NOTE: Hire jobs have fixed duration - speed bonuses don't affect contract length
  function getAdjustedDuration(content: { durationMs: number; category: string }): number {
    if (content.category === "hire") {
      // Hire jobs have fixed duration
      return Math.floor(content.durationMs / 1000)
    }
    
    let adjustedMs = content.durationMs
    
    // Apply speed bonus (founder + UP ranks + RP perks + hires)
    if (totalSpeedBonus > 0) {
      adjustedMs = adjustedMs / (1 + totalSpeedBonus / 100)
    }
    
    // Apply level bonus (1% per level above 1) - must match backend LEVEL_REWARDS.globalEfficiencyPerLevel
    const playerLevel = playerState?.level ?? 1
    if (playerLevel > 1) {
      const levelBonus = 1 + (playerLevel - 1) * 0.01
      adjustedMs = adjustedMs / levelBonus
    }
    
    // Apply staff bonus for model training (10% per junior researcher)
    if (content.category === "model" && labState?.juniorResearchers && labState.juniorResearchers > 0) {
      const staffBonus = 1 + labState.juniorResearchers * 0.1
      adjustedMs = adjustedMs / staffBonus
    }
    
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
    const content = getContentById(jobId)
    if (!content || !labState) {
      return { disabled: true, reason: "loading" }
    }

    // Calculate adjusted cost
    const adjustedCost = getAdjustedCost(content.jobMoneyCost ?? 0)

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
    const computeCost = content.jobComputeCost ?? 0
    if (computeCost > 0 && availableGpus < computeCost) {
      gpuShortfall = computeCost - availableGpus
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

  // Helper to build unified requirements array for an action
  // Order: research -> level -> compute -> money
  function buildRequirements(
    content: ContentEntry,
    adjustedCost: number,
    computeCost: number
  ): ActionRequirement[] {
    const requirements: ActionRequirement[] = []
    const playerLevel = playerState?.level ?? 1
    const currentCash = labState?.cash ?? 0

    // Level requirement
    if (content.minLevel && content.minLevel > 1) {
      const met = playerLevel >= content.minLevel
      requirements.push({
        type: 'level',
        label: String(content.minLevel),
        value: content.minLevel,
        met,
        navigable: !met,
        link: !met ? { view: 'lab/levels' as const } : undefined,
      })
    }

    // Compute requirement - show shortfall when not met
    if (computeCost > 0) {
      const met = availableGpus >= computeCost
      const shortfall = met ? 0 : computeCost - availableGpus
      requirements.push({
        type: 'compute',
        label: met ? String(computeCost) : String(shortfall),
        value: met ? computeCost : shortfall,
        met,
        navigable: !met,
        link: !met ? { view: 'lab', target: 'upgrades' } : undefined,
      })
    }

    // Money requirement - show shortfall when not met
    if (adjustedCost > 0) {
      const met = currentCash >= adjustedCost
      const shortfall = met ? 0 : adjustedCost - currentCash
      requirements.push({
        type: 'money',
        label: met ? String(adjustedCost) : String(shortfall),
        value: met ? adjustedCost : shortfall,
        met,
        navigable: false, // Can't navigate to "get more money"
      })
    }

    return requirements
  }

  // Build actions from available jobs
  // Only show jobs in Operate (no pure research unlocks)
  const actions: Action[] = (availableJobs || [])
    .filter((job) => {
      if (!job.isUnlocked) return false
      const content = getContentById(job.id)
      // Filter out content without jobs and pure research unlocks
      return content && content.jobDurationMs !== undefined && content.contentType !== "research"
    })
    .map((job) => {
      const content = getContentById(job.id)
      if (!content) return null

      const disabledInfo = getJobDisabledInfo(job.id)
      const isActive = inProgressTasks.some((t) => t.type === job.id)
      const isQueued = queuedTasks.some((t) => t.type === job.id)

      // Determine display category for Operate
      let category: "TRAINING" | "INCOME" | "HIRING" | "CONTRACTS" | "RESEARCH" = "TRAINING"
      if (content.contentType === "contract") category = "CONTRACTS"
      if (content.contentType === "income") category = "INCOME"
      if (content.contentType === "hire") category = "HIRING"

      // Get model size from name if training job
      let size: string | undefined
      if (content.contentType === "model") {
        const match = content.name.match(/(\d+B)/)
        size = match ? match[1] : undefined
      }

      // Short name for display
      let displayName = content.name
      if (content.contentType === "model") {
        // Extract model type (TTS, VLM, LLM) from name
        if (content.name.includes("TTS")) displayName = "TTS"
        else if (content.name.includes("VLM")) displayName = "VLM"
        else if (content.name.includes("LLM")) displayName = content.name
      }

      // Get training history for this content (if model)
      // Handle legacy "bp_" prefix in blueprintId stored in database
      const history = content.contentType === "model" && trainingHistory 
        ? (trainingHistory[content.id] || trainingHistory[`bp_${content.id}`])
        : undefined

      // Calculate adjusted values based on current bonuses
      const adjustedDuration = getAdjustedDuration({ 
        durationMs: content.jobDurationMs ?? 0, 
        category: content.contentType 
      })
      const adjustedCashReward = getAdjustedCashReward(content.rewardMoney || 0)
      const adjustedCost = getAdjustedCost(content.jobMoneyCost ?? 0)
      const computeCost = content.jobComputeCost ?? 0

      // Build unified requirements array
      const requirements = buildRequirements(content, adjustedCost, computeCost)

      return {
        id: job.id,
        category,
        name: displayName,
        description: content.description,
        size,
        cost: adjustedCost,
        gpuCost: computeCost,
        duration: adjustedDuration,
        rpReward: content.rewardRP || undefined,
        xpReward: content.rewardXP || undefined,
        cashReward: adjustedCashReward || undefined,
        disabled: disabledInfo.disabled,
        disabledReason: disabledInfo.reason,
        fundsShortfall: disabledInfo.fundsShortfall || 0,
        gpuShortfall: disabledInfo.gpuShortfall || 0,
        ...getContentImages(content),
        isActive,
        remainingTime: getJobRemainingTime(job.id),
        speedFactor: isActive ? getJobSpeedFactor(job.id) : 1,
        isQueued,
        locked: false,
        // Training history
        latestVersion: history?.latestVersion,
        versionCount: history?.versionCount,
        bestScore: history?.bestScore,
        // Unified requirements
        requirements,
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
    isLoading: isInitializing || !labData,
    needsFounderSelection: !isInitializing && !!labData && !labData.lab,
  }

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  )
}
