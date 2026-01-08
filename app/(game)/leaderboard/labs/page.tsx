"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { LabsLeaderboard } from "@/components/game/dashboard/labs-leaderboard"

export default function LabsLeaderboardPage() {
  const { lab } = useGameData()

  if (!lab) {
    return null
  }

  return <LabsLeaderboard labId={lab._id} />
}

