"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { GlobeHemisphereWest, Trophy, Medal, Crown, Star } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCompact } from "@/lib/utils"

type LeaderboardType = "weekly" | "monthly" | "allTime"

interface WorldViewProps {
  labName: string
  playerLevel: number
}

export function WorldView({ labName, playerLevel }: WorldViewProps) {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("weekly")
  
  const leaderboard = useQuery(api.tasks.getLeaderboard, { 
    type: leaderboardType,
    limit: 20 
  })

  const publicModels = useQuery(api.tasks.getPublicModels, { limit: 10 })

  // Level gates for leaderboards
  const weeklyUnlocked = playerLevel >= 5
  const monthlyUnlocked = playerLevel >= 7
  const allTimeUnlocked = playerLevel >= 9

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" weight="fill" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" weight="fill" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" weight="fill" />
    return <span className="text-sm text-muted-foreground w-5 text-center">{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card/50 rounded-lg border border-border">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <GlobeHemisphereWest className="w-6 h-6 text-white" weight="fill" />
        </div>
        <div>
          <h2 className="text-xl font-bold">World</h2>
          <p className="text-sm text-muted-foreground">Global leaderboards and public labs</p>
        </div>
      </div>

      {/* Leaderboard Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={leaderboardType === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setLeaderboardType("weekly")}
          disabled={!weeklyUnlocked}
          className="text-xs"
        >
          <Trophy className="w-4 h-4 mr-1" />
          Weekly
          {!weeklyUnlocked && <span className="ml-1 text-muted-foreground">(Lvl 5)</span>}
        </Button>
        <Button
          variant={leaderboardType === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setLeaderboardType("monthly")}
          disabled={!monthlyUnlocked}
          className="text-xs"
        >
          <Trophy className="w-4 h-4 mr-1" />
          Monthly
          {!monthlyUnlocked && <span className="ml-1 text-muted-foreground">(Lvl 7)</span>}
        </Button>
        <Button
          variant={leaderboardType === "allTime" ? "default" : "outline"}
          size="sm"
          onClick={() => setLeaderboardType("allTime")}
          disabled={!allTimeUnlocked}
          className="text-xs"
        >
          <Crown className="w-4 h-4 mr-1" />
          All-Time
          {!allTimeUnlocked && <span className="ml-1 text-muted-foreground">(Lvl 9)</span>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {leaderboardType === "weekly" && "Weekly Leaderboard"}
              {leaderboardType === "monthly" && "Monthly Leaderboard"}
              {leaderboardType === "allTime" && "All-Time Leaderboard"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No public models yet</p>
                <p className="text-xs mt-1">Publish models to compete!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.labId}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      entry.labName === labName
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="w-6 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.labName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.modelCount} model{entry.modelCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4" weight="fill" />
                      <span className="font-bold">{formatCompact(entry.totalScore)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Public Models */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Top Public Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!publicModels || publicModels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GlobeHemisphereWest className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No public models yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {publicModels.slice(0, 10).map((model, index) => (
                  <div
                    key={model._id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-6 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.labName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4" weight="fill" />
                      <span className="font-bold">{model.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

