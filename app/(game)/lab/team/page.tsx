"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { TeamView } from "@/components/game/dashboard/team-view"

export default function LabTeamPage() {
  const { user, lab, labState } = useGameData()

  if (!user || !lab || !labState) {
    return null
  }

  return (
    <TeamView
      founderName={user.name || user.email}
      founderType={lab.founderType}
      juniorResearchers={labState.juniorResearchers}
    />
  )
}

