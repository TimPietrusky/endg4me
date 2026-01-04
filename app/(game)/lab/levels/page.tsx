"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { LevelsView } from "@/components/game/dashboard/levels-view"

export default function LabLevelsPage() {
  const { playerState } = useGameData()

  if (!playerState) {
    return null
  }

  return (
    <LevelsView 
      currentLevel={playerState.level} 
      currentXp={playerState.experience} 
    />
  )
}

