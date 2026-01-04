"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { TASKS, XP_CURVE } from "@/convex/lib/gameConstants"
import { formatTimeRemaining } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Action, Notification } from "@/lib/game-types"

interface GameData {
  // Core data
  user: Doc<"users"> | null
  lab: Doc<"labs"> | null
  labState: Doc<"labState"> | null
  playerState: Doc<"playerState"> | null
  userId: string | null
  
  // Derived data
  xpRequired: number
  maxParallelTasks: number
  activeTaskCount: number
  isQueueFull: boolean
  availableGpus: number
  
  // Lists
  actions: Action[]
  notifications: Notification[]
  trainedModels: Doc<"trainedModels">[] | undefined
  modelStats: { bestModel?: { score: number } } | null | undefined
  
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

interface GameDataProviderProps {
  children: ReactNode
}

export function GameDataProvider({ children }: GameDataProviderProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user ID from API
  useEffect(() => {
    async function initUser() {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          const data = await res.json()
          setUserId(data.convexUserId)
        }
      } catch (error) {
        console.error("Failed to get user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    initUser()
  }, [])

  // Convex queries - all in the provider so they persist across route changes
  const labData = useQuery(
    api.labs.getFullLabData,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )
  
  const activeTasks = useQuery(
    api.tasks.getActiveTasks,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )
  
  const freelanceCooldown = useQuery(
    api.tasks.getFreelanceCooldown,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )
  
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )
  
  const recentActivity = useQuery(
    api.notifications.getRecentActivity,
    userId ? { userId: userId as Id<"users">, limit: 20 } : "skip"
  )
  
  const modelStats = useQuery(
    api.tasks.getModelStats,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )
  
  const trainedModels = useQuery(
    api.tasks.getTrainedModels,
    labData?.lab ? { labId: labData.lab._id } : "skip"
  )

  // Mutations
  const startTask = useMutation(api.tasks.startTask)
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
  const xpRequired = playerState ? (XP_CURVE[playerState.level] || 100) : 100
  const inProgressTasks = activeTasks?.filter((t) => t.status === "in_progress") || []
  const queuedTasks = activeTasks?.filter((t) => t.status === "queued") || []
  
  const maxParallelTasks = labState 
    ? labState.parallelTasks + labState.juniorResearchers 
    : 1
  const activeTaskCount = inProgressTasks.length
  const isQueueFull = activeTaskCount >= maxParallelTasks
  const isStaffFull = labState ? labState.juniorResearchers >= labState.staffCapacity : false
  const isFreelanceOnCooldown = freelanceCooldown && freelanceCooldown > Date.now()
  
  const usedGpus = inProgressTasks.filter(
    (t) => t.type === "train_small_model" || t.type === "train_medium_model"
  ).length
  const availableGpus = labState ? labState.computeUnits - usedGpus : 0

  // Helper functions for disabled info
  const getTrainingDisabledInfo = (cost: number, gpuCost: number) => {
    if (!labState) return { reason: "loading", fundsShortfall: 0, gpuShortfall: 0 }
    if (labState.cash < cost) {
      return { reason: "not enough funds", fundsShortfall: cost - labState.cash, gpuShortfall: 0 }
    }
    if (gpuCost > 0 && availableGpus < gpuCost) {
      return { reason: "not enough CU", fundsShortfall: 0, gpuShortfall: gpuCost - availableGpus }
    }
    if (isQueueFull) {
      return { reason: "queue full", fundsShortfall: 0, gpuShortfall: 0 }
    }
    return { reason: undefined, fundsShortfall: 0, gpuShortfall: 0 }
  }

  const getFreelanceDisabledInfo = () => {
    if (isFreelanceOnCooldown) {
      return { reason: "on cooldown", fundsShortfall: 0, gpuShortfall: 0 }
    }
    if (isQueueFull) {
      return { reason: "queue full", fundsShortfall: 0, gpuShortfall: 0 }
    }
    return { reason: undefined, fundsShortfall: 0, gpuShortfall: 0 }
  }

  const getHireDisabledInfo = () => {
    if (!labState) return { reason: "loading", fundsShortfall: 0, gpuShortfall: 0 }
    if (labState.cash < TASKS.hire_junior_researcher.cost) {
      return { reason: "not enough funds", fundsShortfall: TASKS.hire_junior_researcher.cost - labState.cash, gpuShortfall: 0 }
    }
    if (isStaffFull) {
      return { reason: "staff capacity full", fundsShortfall: 0, gpuShortfall: 0 }
    }
    return { reason: undefined, fundsShortfall: 0, gpuShortfall: 0 }
  }

  const getRentGpuDisabledInfo = () => {
    if (!labState) return { reason: "loading", fundsShortfall: 0, gpuShortfall: 0 }
    if (labState.cash < TASKS.rent_gpu_cluster.cost) {
      return { reason: "not enough funds", fundsShortfall: TASKS.rent_gpu_cluster.cost - labState.cash, gpuShortfall: 0 }
    }
    if (isQueueFull) {
      return { reason: "queue full", fundsShortfall: 0, gpuShortfall: 0 }
    }
    return { reason: undefined, fundsShortfall: 0, gpuShortfall: 0 }
  }

  function getTaskRemainingTime(taskType: string): number | undefined {
    const task = inProgressTasks.find((t) => t.type === taskType)
    if (task?.completesAt) {
      return Math.max(0, Math.floor((task.completesAt - Date.now()) / 1000))
    }
    return undefined
  }

  // Build actions
  const smallModelInfo = getTrainingDisabledInfo(TASKS.train_small_model.cost, TASKS.train_small_model.computeRequired)
  const mediumModelInfo = getTrainingDisabledInfo(TASKS.train_medium_model.cost, TASKS.train_medium_model.computeRequired)
  const freelanceInfo = getFreelanceDisabledInfo()
  const hireInfo = getHireDisabledInfo()
  const rentGpuInfo = getRentGpuDisabledInfo()

  const actions: Action[] = labState ? [
    {
      id: "train-small",
      category: "TRAINING",
      name: "TTS",
      description: "Train a text-to-speech model to gain research points",
      size: "3B",
      cost: TASKS.train_small_model.cost,
      gpuCost: TASKS.train_small_model.computeRequired,
      duration: Math.floor(TASKS.train_small_model.duration / 1000),
      rpReward: TASKS.train_small_model.baseRewards.researchPoints,
      xpReward: TASKS.train_small_model.baseRewards.experience,
      disabled: !!smallModelInfo.reason,
      disabledReason: smallModelInfo.reason,
      fundsShortfall: smallModelInfo.fundsShortfall,
      gpuShortfall: smallModelInfo.gpuShortfall,
      image: "/ai-neural-network-training-blue-glow.jpg",
      isActive: inProgressTasks.some((t) => t.type === "train_small_model"),
      remainingTime: getTaskRemainingTime("train_small_model"),
      isQueued: queuedTasks.some((t) => t.type === "train_small_model"),
    },
    {
      id: "train-medium",
      category: "TRAINING",
      name: "VLM",
      description: "Train a vision language model for higher rewards",
      size: "7B",
      cost: TASKS.train_medium_model.cost,
      gpuCost: TASKS.train_medium_model.computeRequired,
      duration: Math.floor(TASKS.train_medium_model.duration / 1000),
      rpReward: TASKS.train_medium_model.baseRewards.researchPoints,
      xpReward: TASKS.train_medium_model.baseRewards.experience,
      disabled: !!mediumModelInfo.reason,
      disabledReason: mediumModelInfo.reason,
      fundsShortfall: mediumModelInfo.fundsShortfall,
      gpuShortfall: mediumModelInfo.gpuShortfall,
      image: "/advanced-ai-training-purple-cyber.jpg",
      isActive: inProgressTasks.some((t) => t.type === "train_medium_model"),
      remainingTime: getTaskRemainingTime("train_medium_model"),
      isQueued: queuedTasks.some((t) => t.type === "train_medium_model"),
    },
    {
      id: "freelance",
      category: "INCOME",
      name: "Freelance AI Contract",
      description: isFreelanceOnCooldown
        ? `On cooldown - ${formatTimeRemaining(freelanceCooldown!)}`
        : "Complete a contract for immediate cash payment",
      cost: 0,
      duration: Math.floor(TASKS.freelance_contract.duration / 1000),
      cashReward: TASKS.freelance_contract.baseRewards.cash,
      xpReward: TASKS.freelance_contract.baseRewards.experience,
      disabled: !!freelanceInfo.reason,
      disabledReason: freelanceInfo.reason,
      image: "/cyberpunk-freelance-coding-terminal.jpg",
      isActive: inProgressTasks.some((t) => t.type === "freelance_contract"),
      remainingTime: getTaskRemainingTime("freelance_contract"),
      isQueued: queuedTasks.some((t) => t.type === "freelance_contract"),
    },
    {
      id: "hire",
      category: "HIRING",
      name: "Hire Junior Researcher",
      description: `Expand your team (${labState.juniorResearchers}/${labState.staffCapacity} staff)`,
      cost: TASKS.hire_junior_researcher.cost,
      duration: Math.floor(TASKS.hire_junior_researcher.duration / 1000),
      speedBonus: 10,
      xpReward: TASKS.hire_junior_researcher.baseRewards.experience,
      disabled: !!hireInfo.reason,
      disabledReason: hireInfo.reason,
      fundsShortfall: hireInfo.fundsShortfall,
      image: "/hiring-tech-researcher-futuristic.jpg",
      isActive: inProgressTasks.some((t) => t.type === "hire_junior_researcher"),
      remainingTime: getTaskRemainingTime("hire_junior_researcher"),
      isQueued: queuedTasks.some((t) => t.type === "hire_junior_researcher"),
    },
    {
      id: "rent-gpu",
      category: "INFRASTRUCTURE",
      name: "Rent GPU Cluster",
      description: `Add compute power (${labState.computeUnits} GPUs)`,
      cost: TASKS.rent_gpu_cluster.cost,
      duration: Math.floor(TASKS.rent_gpu_cluster.duration / 1000),
      gpuBonus: 1,
      xpReward: TASKS.rent_gpu_cluster.baseRewards.experience,
      disabled: !!rentGpuInfo.reason,
      disabledReason: rentGpuInfo.reason,
      fundsShortfall: rentGpuInfo.fundsShortfall,
      image: "/massive-ai-datacenter-training.jpg",
      isActive: inProgressTasks.some((t) => t.type === "rent_gpu_cluster"),
      remainingTime: getTaskRemainingTime("rent_gpu_cluster"),
      isQueued: queuedTasks.some((t) => t.type === "rent_gpu_cluster"),
    },
  ] : []

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
    
    const taskTypeMap: Record<string, "train_small_model" | "train_medium_model" | "freelance_contract" | "hire_junior_researcher" | "rent_gpu_cluster"> = {
      "train-small": "train_small_model",
      "train-medium": "train_medium_model",
      "freelance": "freelance_contract",
      "hire": "hire_junior_researcher",
      "rent-gpu": "rent_gpu_cluster",
    }

    const taskType = taskTypeMap[action.id]
    if (!taskType) return

    try {
      await startTask({ labId: lab._id, taskType })
      toast({
        title: "Task Started",
        description: `${action.name} is now in progress`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to start task",
        description: error.message || "An error occurred",
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
    actions,
    notifications,
    trainedModels,
    modelStats,
    unreadCount: unreadCount || 0,
    publicModelCount,
    privateModelCount,
    handleStartAction,
    handleMarkAsRead,
    isLoading: isLoading || labData === undefined,
    needsFounderSelection: !isLoading && labData !== undefined && (!labData || !labData.lab),
  }

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  )
}

