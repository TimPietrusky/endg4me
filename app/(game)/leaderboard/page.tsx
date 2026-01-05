"use client"

import { useState } from "react"
import { Trophy, Ranking } from "@phosphor-icons/react"
import { useGameData } from "@/components/providers/game-data-provider"
import { LabsLeaderboard } from "@/components/game/dashboard/labs-leaderboard"
import { ModelsLeaderboard } from "@/components/game/dashboard/models-leaderboard"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

type LeaderboardTab = "labs" | "models"

export default function LeaderboardPage() {
  const { lab } = useGameData()
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("labs")

  if (!lab) {
    return null
  }

  return (
    <>
      {/* SubNav - Labs and Models tabs (no level gates) */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={activeTab === "labs"}
          onClick={() => setActiveTab("labs")}
        >
          <Trophy className="w-4 h-4 mr-1" />
          LABS
        </SubNavButton>
        <SubNavButton
          isActive={activeTab === "models"}
          onClick={() => setActiveTab("models")}
        >
          <Ranking className="w-4 h-4 mr-1" />
          MODELS
        </SubNavButton>
      </SubNavContainer>

      {/* Main content */}
      {activeTab === "labs" && <LabsLeaderboard labId={lab._id} />}
      {activeTab === "models" && <ModelsLeaderboard labId={lab._id} />}
    </>
  )
}
