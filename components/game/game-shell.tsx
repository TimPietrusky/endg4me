"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { GameTopNav } from "./game-top-nav"
import { TaskToastContainer } from "./task-toast"
import { Toaster } from "@/components/ui/toaster"
import type { ReactNode } from "react"
import type { Id } from "@/convex/_generated/dataModel"

interface GameShellProps {
  children: ReactNode
}

export function GameShell({ children }: GameShellProps) {
  const router = useRouter()
  const { 
    isLoading, 
    needsFounderSelection, 
    userId,
    user,
    lab,
    labState,
    playerState,
    xpRequired,
    unreadCount,
    usedCompute,
    computeCapacity,
    staffCapacity,
    upgradePoints,
    activeTaskCount,
    maxParallelTasks,
  } = useGameData()
  
  // Check if user is admin
  const isAdmin = useQuery(
    api.dev.checkIsAdmin, 
    userId ? { userId: userId as Id<"users"> } : "skip"
  )

  // Redirect to /new if user needs to create a lab
  useEffect(() => {
    if (needsFounderSelection) {
      router.replace("/new")
    }
  }, [needsFounderSelection, router])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!userId) {
    return <LoadingScreen message="Connecting..." />
  }

  if (needsFounderSelection) {
    return <LoadingScreen message="Redirecting to lab setup..." />
  }

  // At this point we have all data
  if (!user || !lab || !labState || !playerState) {
    return <LoadingScreen message="Loading lab..." />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GameTopNav
        labName={lab.name}
        founderName={user.name || user.email}
        founderType={lab.founderType}
        level={playerState.level}
        xp={playerState.experience}
        maxXp={xpRequired}
        cash={labState.cash}
        rp={labState.researchPoints}
        usedCU={usedCompute}
        totalCU={computeCapacity}
        teamSize={1 + labState.juniorResearchers}
        teamCapacity={staffCapacity}
        notificationCount={unreadCount}
        upgradePoints={upgradePoints}
        activeTaskCount={activeTaskCount}
        maxParallelTasks={maxParallelTasks}
        userId={userId as Id<"users">}
        isAdmin={isAdmin === true}
      />
      
      <div className="px-6 pb-6">
        {children}
      </div>

      <TaskToastContainer userId={userId as Id<"users">} />
      <Toaster />
    </div>
  )
}

function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

