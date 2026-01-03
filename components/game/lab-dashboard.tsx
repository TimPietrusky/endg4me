"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { TASKS, XP_CURVE, LEVEL_REWARDS } from "@/convex/lib/gameConstants"
import { formatCash, formatTimeRemaining, calculateXPProgress } from "@/lib/utils"

import { TopNav } from "./dashboard/top-nav"
import { TasksView } from "./dashboard/tasks-view"
import { CollectionView } from "./dashboard/collection-view"
import { MsgsView } from "./dashboard/msgs-view"
import { TaskToastContainer } from "./task-toast"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import type { ViewType, Action, Notification } from "@/lib/game-types"

interface LabDashboardProps {
  lab: Doc<"labs">
  labState: Doc<"labState">
  playerState: Doc<"playerState">
  userId: string
}

export function LabDashboard({
  lab,
  labState,
  playerState,
  userId,
}: LabDashboardProps) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<ViewType>("tasks")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showRunningOnly, setShowRunningOnly] = useState(false)

  // Convex queries
  const activeTasks = useQuery(api.tasks.getActiveTasks, { labId: lab._id })
  const freelanceCooldown = useQuery(api.tasks.getFreelanceCooldown, { labId: lab._id })
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: userId as Id<"users">,
  })
  const recentActivity = useQuery(api.notifications.getRecentActivity, {
    userId: userId as Id<"users">,
    limit: 20,
  })
  const modelStats = useQuery(api.tasks.getModelStats, { labId: lab._id })
  const trainedModels = useQuery(api.tasks.getTrainedModels, { labId: lab._id })

  // Mutations
  const startTask = useMutation(api.tasks.startTask)
  const markNotificationRead = useMutation(api.notifications.markAsRead)

  // Re-render every second for task timers
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate derived state
  const xpRequired = XP_CURVE[playerState.level] || 100
  const xpProgress = calculateXPProgress(playerState.experience, xpRequired)

  const inProgressTasks = activeTasks?.filter((t) => t.status === "in_progress") || []
  const queuedTasks = activeTasks?.filter((t) => t.status === "queued") || []

  // Calculate capacity
  const maxParallelTasks = labState.parallelTasks + labState.juniorResearchers
  const runningTaskCount = inProgressTasks.length
  const isQueueFull = runningTaskCount >= maxParallelTasks
  const isStaffFull = labState.juniorResearchers >= labState.staffCapacity
  const isFreelanceOnCooldown = freelanceCooldown && freelanceCooldown > Date.now()

  // Check what blocks each task type
  // Training: needs funds + queue slot
  // Freelance: needs queue slot + not on cooldown
  // Hire: needs funds + staff capacity (does NOT need queue slot - hiring is instant effect)
  
  const getTrainingDisabledInfo = (cost: number) => {
    if (labState.cash < cost) {
      return { reason: "not enough funds", shortfall: cost - labState.cash }
    }
    if (isQueueFull) {
      return { reason: "queue full", shortfall: 0 }
    }
    return { reason: undefined, shortfall: 0 }
  }

  const getFreelanceDisabledInfo = () => {
    if (isFreelanceOnCooldown) {
      return { reason: "on cooldown", shortfall: 0 }
    }
    if (isQueueFull) {
      return { reason: "queue full", shortfall: 0 }
    }
    return { reason: undefined, shortfall: 0 }
  }

  const getHireDisabledInfo = () => {
    if (labState.cash < TASKS.hire_junior_researcher.cost) {
      return { reason: "not enough funds", shortfall: TASKS.hire_junior_researcher.cost - labState.cash }
    }
    if (isStaffFull) {
      return { reason: "staff capacity full", shortfall: 0 }
    }
    return { reason: undefined, shortfall: 0 }
  }

  const smallModelInfo = getTrainingDisabledInfo(TASKS.train_small_model.cost)
  const mediumModelInfo = getTrainingDisabledInfo(TASKS.train_medium_model.cost)
  const freelanceInfo = getFreelanceDisabledInfo()
  const hireInfo = getHireDisabledInfo()

  // Build actions list for the new UI
  const actions: Action[] = [
    {
      id: "train-small",
      category: "TRAINING",
      name: "TTS",
      description: "Train a text-to-speech model to gain research points",
      size: "3B",
      cost: TASKS.train_small_model.cost,
      duration: Math.floor(TASKS.train_small_model.duration / 1000), // Convert ms to seconds
      rpReward: TASKS.train_small_model.baseRewards.researchPoints,
      reputationReward: TASKS.train_small_model.baseRewards.reputation,
      xpReward: TASKS.train_small_model.baseRewards.experience,
      disabled: !!smallModelInfo.reason,
      disabledReason: smallModelInfo.reason,
      fundsShortfall: smallModelInfo.shortfall,
      image: "/ai-neural-network-training-blue-glow.jpg",
      isRunning: inProgressTasks.some((t) => t.type === "train_small_model"),
      remainingTime: getTaskRemainingTime("train_small_model"),
    },
    {
      id: "train-medium",
      category: "TRAINING",
      name: "VLM",
      description: "Train a vision language model for higher rewards",
      size: "7B",
      cost: TASKS.train_medium_model.cost,
      duration: Math.floor(TASKS.train_medium_model.duration / 1000),
      rpReward: TASKS.train_medium_model.baseRewards.researchPoints,
      reputationReward: TASKS.train_medium_model.baseRewards.reputation,
      xpReward: TASKS.train_medium_model.baseRewards.experience,
      disabled: !!mediumModelInfo.reason,
      disabledReason: mediumModelInfo.reason,
      fundsShortfall: mediumModelInfo.shortfall,
      image: "/advanced-ai-training-purple-cyber.jpg",
      isRunning: inProgressTasks.some((t) => t.type === "train_medium_model"),
      remainingTime: getTaskRemainingTime("train_medium_model"),
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
      reputationReward: TASKS.freelance_contract.baseRewards.reputation,
      xpReward: TASKS.freelance_contract.baseRewards.experience,
      disabled: !!freelanceInfo.reason,
      disabledReason: freelanceInfo.reason,
      image: "/cyberpunk-freelance-coding-terminal.jpg",
      isRunning: inProgressTasks.some((t) => t.type === "freelance_contract"),
      remainingTime: getTaskRemainingTime("freelance_contract"),
    },
    {
      id: "hire",
      category: "HIRING",
      name: "Hire Junior Researcher",
      description: `Expand your team (${labState.juniorResearchers}/${labState.staffCapacity} staff)`,
      cost: TASKS.hire_junior_researcher.cost,
      duration: Math.floor(TASKS.hire_junior_researcher.duration / 1000),
      speedBonus: 10,
      parallelBonus: 1,
      xpReward: TASKS.hire_junior_researcher.baseRewards.experience,
      disabled: !!hireInfo.reason,
      disabledReason: hireInfo.reason,
      fundsShortfall: hireInfo.shortfall,
      image: "/hiring-tech-researcher-futuristic.jpg",
      isRunning: inProgressTasks.some((t) => t.type === "hire_junior_researcher"),
      remainingTime: getTaskRemainingTime("hire_junior_researcher"),
    },
  ]

  // Add queued status to actions
  actions.forEach((action) => {
    const queuedTask = queuedTasks.find((t) => {
      if (action.id === "train-small") return t.type === "train_small_model"
      if (action.id === "train-medium") return t.type === "train_medium_model"
      if (action.id === "freelance") return t.type === "freelance_contract"
      if (action.id === "hire") return t.type === "hire_junior_researcher"
      return false
    })
    if (queuedTask) {
      action.isQueued = true
    }
  })

  function getTaskRemainingTime(taskType: string): number | undefined {
    const task = inProgressTasks.find((t) => t.type === taskType)
    if (task?.completesAt) {
      return Math.max(0, Math.floor((task.completesAt - Date.now()) / 1000))
    }
    return undefined
  }

  const handleStartAction = async (action: Action) => {
    const taskTypeMap: Record<string, "train_small_model" | "train_medium_model" | "freelance_contract" | "hire_junior_researcher"> = {
      "train-small": "train_small_model",
      "train-medium": "train_medium_model",
      "freelance": "freelance_contract",
      "hire": "hire_junior_researcher",
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

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  // Convert Convex notifications to our type
  const notifications: Notification[] = (recentActivity || []).map((n) => ({
    id: n._id,
    type: n.type as Notification["type"],
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
  }))

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await markNotificationRead({ notificationId: id as Id<"notifications"> })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav
        labName={lab.name}
        founderType={lab.founderType}
        level={playerState.level}
        xp={playerState.experience}
        maxXp={xpRequired}
        cash={labState.cash}
        rp={labState.researchPoints}
        reputation={labState.reputation}
        modelsTrained={modelStats?.totalModels || 0}
        currentView={currentView}
        setCurrentView={setCurrentView}
        notificationCount={unreadCount || 0}
        actionsCount={actions.length}
      />

      <div className="px-6 pb-6">
        {currentView === "tasks" && (
          <TasksView
            actions={actions}
            showRunningOnly={showRunningOnly}
            setShowRunningOnly={setShowRunningOnly}
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            onStartAction={handleStartAction}
            maxParallelTasks={labState.parallelTasks + labState.juniorResearchers}
          />
        )}

        {currentView === "models" && (
          <CollectionView
            models={trainedModels}
            bestScore={modelStats?.bestModel?.score}
          />
              )}

        {currentView === "msgs" && (
          <MsgsView
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
          />
              )}
            </div>

      {/* Toast notifications for task completions */}
      <TaskToastContainer userId={userId} />
      <Toaster />
    </div>
  )
}
