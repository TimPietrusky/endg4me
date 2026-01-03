"use client"

import { useState } from "react"
import { TopNav } from "./dashboard/top-nav"
import { TasksView } from "./dashboard/tasks-view"
import { CollectionView } from "./dashboard/collection-view"
import { MsgsView } from "./dashboard/msgs-view"
import { defaultActions, defaultNotifications } from "@/lib/game-data"
import type { GameState, ViewType, Action } from "@/lib/game-types"

interface TerminalProps {
  gameState: GameState
  activeTasks: any[]
  queuedTasks: any[]
  recentActivities: any[]
  cooldowns: Record<string, number>
  onStartAction: (action: Action) => void
  onNotificationClick: () => void
  onClansClick: () => void
  onModelCollectionClick: () => void
  onSignOut: () => void
}

export function Terminal({ gameState: initialGameState, onStartAction }: TerminalProps) {
  const [currentView, setCurrentView] = useState<ViewType>("tasks")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showRunningOnly, setShowRunningOnly] = useState(false)
  const [showTooltips, setShowTooltips] = useState(false)

  const gameState = {
    playerName: initialGameState.labName || "nerd labs",
    level: initialGameState.playerLevel || 2,
    xp: initialGameState.xp?.current || 18300,
    maxXp: initialGameState.xp?.max || 20000,
    cash: initialGameState.cash || 3120,
    rp: initialGameState.researchPoints || 551,
    reputation: initialGameState.reputation || 23,
    role: initialGameState.founderType || "Technical Founder",
    modelsTrained: initialGameState.modelsTrained || 3,
    researchers: initialGameState.staffCount?.current || 0,
    taskQueue: initialGameState.queueSlots || 1,
  }

  const actions = defaultActions.map((action) => ({
    ...action,
    disabled:
      (action.cost > 0 && gameState.cash < action.cost) ||
      (action.category === "TRAINING" && gameState.researchers >= gameState.taskQueue),
    isRunning: action.id === "train-small" || action.id === "freelance",
    remainingTime: action.id === "train-small" ? 187 : action.id === "freelance" ? 94 : undefined,
  }))

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav
        gameState={gameState}
        currentView={currentView}
        setCurrentView={setCurrentView}
        notificationCount={defaultNotifications.length}
        showTooltips={showTooltips}
        setShowTooltips={setShowTooltips}
        actionsCount={actions.length}
      />

      <div className="p-6">
        {currentView === "tasks" && (
          <TasksView
            actions={actions}
            showRunningOnly={showRunningOnly}
            setShowRunningOnly={setShowRunningOnly}
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            onStartAction={onStartAction}
          />
        )}

        {currentView === "models" && <CollectionView />}

        {currentView === "msgs" && <MsgsView notifications={defaultNotifications} />}
      </div>
    </div>
  )
}
