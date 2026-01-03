"use client"

import { useState, useEffect } from "react"
import { Terminal } from "@/components/terminal-dashboard"
import { NotificationPanel } from "@/components/notification-panel"
import { ClanPanel } from "@/components/clan-panel"
import { ModelCollectionPanel } from "@/components/model-collection-panel"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

// Mock game state
export default function DashboardPage() {
  const { toast } = useToast()
  const [gameState, setGameState] = useState({
    labName: "nerd labs",
    founderType: "Technical Founder",
    cash: 3120,
    researchPoints: 551,
    reputation: 23,
    compute: { current: 0, max: 1 },
    playerLevel: 2,
    xp: { current: 18, max: 300 },
    modelsTrained: 3,
    bestModelScore: 265,
    staffCount: { current: 0, max: 5 },
    queueSlots: 1,
    parallelTasks: 1,
    notificationCount: 9,
  })

  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [queuedTasks, setQueuedTasks] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([
    {
      id: "1",
      type: "task_complete",
      title: "Small Model Training Complete",
      message: "+120 RP, +5 Rep",
      timestamp: "2m ago",
    },
    {
      id: "2",
      type: "level_up",
      title: "Level Up!",
      message: "Reached Level 2 - Task Queue Unlocked",
      timestamp: "5m ago",
    },
  ])

  const [showNotifications, setShowNotifications] = useState(false)
  const [showClans, setShowClans] = useState(false)
  const [showModelCollection, setShowModelCollection] = useState(false)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  // Simulate task completion
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTasks.length > 0) {
        const updatedTasks = activeTasks.map((task) => {
          const newTimeRemaining = task.timeRemaining - 1
          if (newTimeRemaining <= 0) {
            // Task complete
            toast({
              title: `${task.name} Complete!`,
              description: task.rewards,
            })

            // Update game state with rewards
            setGameState((prev) => ({
              ...prev,
              researchPoints: prev.researchPoints + task.rpReward,
              reputation: prev.reputation + task.repReward,
              xp: {
                ...prev.xp,
                current: prev.xp.current + task.xpReward,
              },
              cash: prev.cash + (task.cashReward || 0),
              compute: {
                ...prev.compute,
                current: Math.max(0, prev.compute.current - 1),
              },
            }))

            return null
          }
          return { ...task, timeRemaining: newTimeRemaining }
        })

        const completedTasks = updatedTasks.filter((t) => t === null)
        const incompleteTasks = updatedTasks.filter((t) => t !== null)

        setActiveTasks(incompleteTasks)

        // Move queued task to active if slot available
        if (completedTasks.length > 0 && queuedTasks.length > 0) {
          const [nextTask, ...remainingQueue] = queuedTasks
          setActiveTasks([...incompleteTasks, { ...nextTask, timeRemaining: nextTask.duration }])
          setQueuedTasks(remainingQueue)
        }
      }

      // Update cooldowns
      setCooldowns((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          updated[key] = Math.max(0, updated[key] - 1)
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeTasks, queuedTasks, toast])

  const startAction = (action: any) => {
    const newTask = {
      id: Date.now().toString(),
      name: action.name,
      duration: action.duration,
      timeRemaining: action.duration,
      rewards: action.rewards,
      rpReward: action.rpReward || 0,
      repReward: action.repReward || 0,
      xpReward: action.xpReward || 0,
      cashReward: action.cashReward || 0,
    }

    if (activeTasks.length < gameState.parallelTasks) {
      setActiveTasks([...activeTasks, newTask])
    } else if (queuedTasks.length < gameState.queueSlots) {
      setQueuedTasks([...queuedTasks, newTask])
    }

    // Update game state based on action cost
    setGameState({
      ...gameState,
      cash: gameState.cash - action.cost,
      compute: { ...gameState.compute, current: gameState.compute.current + 1 },
    })

    // Set cooldown if action has one
    if (action.cooldown) {
      setCooldowns((prev) => ({
        ...prev,
        [action.id]: action.cooldown,
      }))
    }
  }

  return (
    <>
      <Terminal
        gameState={gameState}
        activeTasks={activeTasks}
        queuedTasks={queuedTasks}
        recentActivities={recentActivities}
        cooldowns={cooldowns}
        onStartAction={startAction}
        onNotificationClick={() => setShowNotifications(true)}
        onClansClick={() => setShowClans(true)}
        onModelCollectionClick={() => setShowModelCollection(true)}
        onSignOut={() => console.log("Sign out")}
      />

      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
      <ClanPanel open={showClans} onClose={() => setShowClans(false)} />
      <ModelCollectionPanel
        open={showModelCollection}
        onClose={() => setShowModelCollection(false)}
        modelsTrained={gameState.modelsTrained}
        bestScore={gameState.bestModelScore}
      />

      <Toaster />
    </>
  )
}
