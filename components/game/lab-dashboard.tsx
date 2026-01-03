"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { TASKS, XP_CURVE } from "@/convex/lib/gameConstants"
import { formatTimeRemaining } from "@/lib/utils"
import { Trophy, Crown } from "@phosphor-icons/react"

import { PageHeader } from "./dashboard/page-header"
import { SubNavContainer, SubNavButton } from "./dashboard/sub-nav"
import { TasksView } from "./dashboard/tasks-view"
import { CollectionView, type VisibilityFilter } from "./dashboard/collection-view"
import { MsgsView, type InboxFilter } from "./dashboard/msgs-view"
import { ResearchView, RESEARCH_CATEGORIES, type ResearchCategory } from "./dashboard/research-view"
import { WorldView, type LeaderboardType, getLeaderboardUnlocks } from "./dashboard/world-view"
import { TaskToastContainer } from "./task-toast"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import type { ViewType, Action, Notification } from "@/lib/game-types"

interface LabDashboardProps {
  user: Doc<"users">
  lab: Doc<"labs">
  labState: Doc<"labState">
  playerState: Doc<"playerState">
  userId: string
}

export function LabDashboard({
  user,
  lab,
  labState,
  playerState,
  userId,
}: LabDashboardProps) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<ViewType>("operate")
  
  // Operate view filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  
  // Research view filters
  const [selectedResearchCategory, setSelectedResearchCategory] = useState<ResearchCategory | null>(null)
  
  // Lab/Collection view filters
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all")
  
  // Inbox view filters
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all")
  
  // World view filters
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("weekly")

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

  const inProgressTasks = activeTasks?.filter((t) => t.status === "in_progress") || []
  const queuedTasks = activeTasks?.filter((t) => t.status === "queued") || []

  // Calculate capacity
  const maxParallelTasks = labState.parallelTasks + labState.juniorResearchers
  const activeTaskCount = inProgressTasks.length
  const isQueueFull = activeTaskCount >= maxParallelTasks
  const isStaffFull = labState.juniorResearchers >= labState.staffCapacity
  const isFreelanceOnCooldown = freelanceCooldown && freelanceCooldown > Date.now()

  // Check what blocks each task type
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

  const getRentGpuDisabledInfo = () => {
    if (labState.cash < TASKS.rent_gpu_cluster.cost) {
      return { reason: "not enough funds", shortfall: TASKS.rent_gpu_cluster.cost - labState.cash }
    }
    if (isQueueFull) {
      return { reason: "queue full", shortfall: 0 }
    }
    return { reason: undefined, shortfall: 0 }
  }

  const smallModelInfo = getTrainingDisabledInfo(TASKS.train_small_model.cost)
  const mediumModelInfo = getTrainingDisabledInfo(TASKS.train_medium_model.cost)
  const freelanceInfo = getFreelanceDisabledInfo()
  const hireInfo = getHireDisabledInfo()
  const rentGpuInfo = getRentGpuDisabledInfo()

  // Build actions list
  const actions: Action[] = [
    {
      id: "train-small",
      category: "TRAINING",
      name: "TTS",
      description: "Train a text-to-speech model to gain research points",
      size: "3B",
      cost: TASKS.train_small_model.cost,
      duration: Math.floor(TASKS.train_small_model.duration / 1000),
      rpReward: TASKS.train_small_model.baseRewards.researchPoints,
      xpReward: TASKS.train_small_model.baseRewards.experience,
      disabled: !!smallModelInfo.reason,
      disabledReason: smallModelInfo.reason,
      fundsShortfall: smallModelInfo.shortfall,
      image: "/ai-neural-network-training-blue-glow.jpg",
      isActive: inProgressTasks.some((t) => t.type === "train_small_model"),
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
      xpReward: TASKS.train_medium_model.baseRewards.experience,
      disabled: !!mediumModelInfo.reason,
      disabledReason: mediumModelInfo.reason,
      fundsShortfall: mediumModelInfo.shortfall,
      image: "/advanced-ai-training-purple-cyber.jpg",
      isActive: inProgressTasks.some((t) => t.type === "train_medium_model"),
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
      xpReward: TASKS.freelance_contract.baseRewards.experience,
      disabled: !!freelanceInfo.reason,
      disabledReason: freelanceInfo.reason,
      image: "/cyberpunk-freelance-coding-terminal.jpg",
      isActive: inProgressTasks.some((t) => t.type === "freelance_contract"),
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
      xpReward: TASKS.hire_junior_researcher.baseRewards.experience,
      disabled: !!hireInfo.reason,
      disabledReason: hireInfo.reason,
      fundsShortfall: hireInfo.shortfall,
      image: "/hiring-tech-researcher-futuristic.jpg",
      isActive: inProgressTasks.some((t) => t.type === "hire_junior_researcher"),
      remainingTime: getTaskRemainingTime("hire_junior_researcher"),
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
      fundsShortfall: rentGpuInfo.shortfall,
      image: "/massive-ai-datacenter-training.jpg",
      isActive: inProgressTasks.some((t) => t.type === "rent_gpu_cluster"),
      remainingTime: getTaskRemainingTime("rent_gpu_cluster"),
    },
  ]

  // Add queued status to actions
  actions.forEach((action) => {
    const queuedTask = queuedTasks.find((t) => {
      if (action.id === "train-small") return t.type === "train_small_model"
      if (action.id === "train-medium") return t.type === "train_medium_model"
      if (action.id === "freelance") return t.type === "freelance_contract"
      if (action.id === "hire") return t.type === "hire_junior_researcher"
      if (action.id === "rent-gpu") return t.type === "rent_gpu_cluster"
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
    read: n.read,
    deepLink: n.deepLink as Notification["deepLink"],
  }))

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await markNotificationRead({ notificationId: id as Id<"notifications"> })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  // Build actionsByCategory for filters
  const actionsByCategory = actions.reduce(
    (acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = []
      }
      acc[action.category].push(action)
      return acc
    },
    {} as Record<string, Action[]>,
  )

  // Model counts for Lab view
  const publicModelCount = trainedModels?.filter((m) => m.visibility === "public").length || 0
  const privateModelCount = trainedModels?.filter((m) => m.visibility !== "public").length || 0

  // Leaderboard unlocks
  const leaderboardUnlocks = getLeaderboardUnlocks(playerState.level)

  // SubNav content per view
  const getSubNav = () => {
    switch (currentView) {
      case "operate":
        return (
          <SubNavContainer>
            <SubNavButton
              isFirst
              isActive={showActiveOnly}
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              badge={`${activeTaskCount}/${maxParallelTasks}`}
            >
              ACTIVE
            </SubNavButton>
            {Object.keys(actionsByCategory).map((category) => (
              <SubNavButton
                key={category}
                isActive={selectedCategories.includes(category)}
                onClick={() => toggleCategory(category)}
                badge={actionsByCategory[category].length}
              >
                {category}
              </SubNavButton>
            ))}
          </SubNavContainer>
        )

      case "research":
        return (
          <SubNavContainer>
            {RESEARCH_CATEGORIES.map((category, index) => (
              <SubNavButton
                key={category}
                isFirst={index === 0}
                isActive={selectedResearchCategory === category}
                onClick={() => setSelectedResearchCategory(
                  selectedResearchCategory === category ? null : category
                )}
              >
                {category.toUpperCase()}
              </SubNavButton>
            ))}
          </SubNavContainer>
        )

      case "lab":
        return (
          <SubNavContainer>
            <SubNavButton
              isFirst
              isActive={visibilityFilter === "public"}
              onClick={() => setVisibilityFilter(
                visibilityFilter === "public" ? "all" : "public"
              )}
              badge={publicModelCount}
            >
              PUBLIC
            </SubNavButton>
            <SubNavButton
              isActive={visibilityFilter === "private"}
              onClick={() => setVisibilityFilter(
                visibilityFilter === "private" ? "all" : "private"
              )}
              badge={privateModelCount}
            >
              PRIVATE
            </SubNavButton>
          </SubNavContainer>
        )

      case "inbox":
        return (
          <SubNavContainer>
            <SubNavButton
              isFirst
              isActive={inboxFilter === "unread"}
              onClick={() => setInboxFilter(
                inboxFilter === "unread" ? "all" : "unread"
              )}
              badge={unreadCount || 0}
            >
              UNREAD
            </SubNavButton>
          </SubNavContainer>
        )

      case "world":
        return (
          <SubNavContainer>
            <SubNavButton
              isFirst
              isActive={leaderboardType === "weekly"}
              onClick={() => setLeaderboardType("weekly")}
              disabled={!leaderboardUnlocks.weekly}
            >
              <Trophy className="w-4 h-4 mr-1" />
              WEEKLY
              {!leaderboardUnlocks.weekly && <span className="ml-1 text-muted-foreground">(Lvl 5)</span>}
            </SubNavButton>
            <SubNavButton
              isActive={leaderboardType === "monthly"}
              onClick={() => setLeaderboardType("monthly")}
              disabled={!leaderboardUnlocks.monthly}
            >
              <Trophy className="w-4 h-4 mr-1" />
              MONTHLY
              {!leaderboardUnlocks.monthly && <span className="ml-1 text-muted-foreground">(Lvl 7)</span>}
            </SubNavButton>
            <SubNavButton
              isActive={leaderboardType === "allTime"}
              onClick={() => setLeaderboardType("allTime")}
              disabled={!leaderboardUnlocks.allTime}
            >
              <Crown className="w-4 h-4 mr-1" />
              ALL-TIME
              {!leaderboardUnlocks.allTime && <span className="ml-1 text-muted-foreground">(Lvl 9)</span>}
            </SubNavButton>
          </SubNavContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader
        labName={lab.name}
        founderName={user.name || user.email}
        founderType={lab.founderType}
        level={playerState.level}
        xp={playerState.experience}
        maxXp={xpRequired}
        cash={labState.cash}
        rp={labState.researchPoints}
        gpus={labState.computeUnits}
        currentView={currentView}
        setCurrentView={setCurrentView}
        notificationCount={unreadCount || 0}
        subNav={getSubNav()}
      />

      <div className="px-6 pb-6">
        {/* OPERATE: Run the lab day-to-day */}
        {currentView === "operate" && (
          <TasksView
            actions={actions}
            showActiveOnly={showActiveOnly}
            selectedCategories={selectedCategories}
            onStartAction={handleStartAction}
          />
        )}

        {/* RESEARCH: Spend RP on permanent unlocks */}
        {currentView === "research" && (
          <ResearchView
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            selectedCategory={selectedResearchCategory}
          />
        )}

        {/* LAB: Your organization / ownership */}
        {currentView === "lab" && (
          <CollectionView
            labName={lab.name}
            models={trainedModels}
            bestScore={modelStats?.bestModel?.score}
            visibilityFilter={visibilityFilter}
          />
        )}

        {/* INBOX: Events/offers/notifications */}
        {currentView === "inbox" && (
          <MsgsView
            notifications={notifications}
            filter={inboxFilter}
            onMarkAsRead={handleMarkAsRead}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {/* WORLD: Global layer - leaderboards, public labs */}
        {currentView === "world" && (
          <WorldView
            labName={lab.name}
            playerLevel={playerState.level}
            leaderboardType={leaderboardType}
          />
        )}
      </div>

      {/* Toast notifications for task completions */}
      <TaskToastContainer userId={userId} />
      <Toaster />
    </div>
  )
}
