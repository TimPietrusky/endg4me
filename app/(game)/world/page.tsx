"use client"

import { useState } from "react"
import { Trophy, Crown } from "@phosphor-icons/react"
import { useGameData } from "@/components/providers/game-data-provider"
import { WorldView, type LeaderboardType, getLeaderboardUnlocks } from "@/components/game/dashboard/world-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

export default function WorldPage() {
  const { lab, playerState } = useGameData()
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("weekly")

  if (!lab || !playerState) {
    return null
  }

  const leaderboardUnlocks = getLeaderboardUnlocks(playerState.level)

  return (
    <>
      {/* SubNav */}
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

      {/* Main content */}
      <WorldView
        labName={lab.name}
        playerLevel={playerState.level}
        leaderboardType={leaderboardType}
      />
    </>
  )
}

