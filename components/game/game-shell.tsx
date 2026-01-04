"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { FounderSelection } from "./founder-selection"
import { GameTopNav } from "./game-top-nav"
import { TaskToastContainer } from "./task-toast"
import { Toaster } from "@/components/ui/toaster"
import type { ReactNode } from "react"

interface GameShellProps {
  children: ReactNode
}

export function GameShell({ children }: GameShellProps) {
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
  } = useGameData()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!userId) {
    return <LoadingScreen message="Connecting..." />
  }

  if (needsFounderSelection) {
    return <FounderSelection userId={userId} />
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
        gpus={labState.computeUnits}
        notificationCount={unreadCount}
      />
      
      <div className="px-6 pb-6">
        {children}
      </div>

      <TaskToastContainer userId={userId} />
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

