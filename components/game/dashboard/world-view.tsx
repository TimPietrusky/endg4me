"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  GlobeHemisphereWest, 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TextAa,
  Microphone,
  Image as ImageIcon
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/utils"

export type LeaderboardType = "weekly" | "monthly" | "allTime"
export type ModelTypeFilter = "all" | "llm" | "tts" | "vlm"

interface WorldViewProps {
  labName: string
  playerLevel: number
  leaderboardType: LeaderboardType
}

export function WorldView({ labName, playerLevel, leaderboardType }: WorldViewProps) {
  const [modelTypeFilter, setModelTypeFilter] = useState<ModelTypeFilter>("all")

  const leaderboard = useQuery(api.tasks.getLeaderboard, { 
    type: leaderboardType,
    modelType: modelTypeFilter === "all" ? undefined : modelTypeFilter,
    limit: 20 
  })

  const publicModels = useQuery(api.tasks.getPublicModels, { 
    limit: 10,
    modelType: modelTypeFilter === "all" ? undefined : modelTypeFilter
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" weight="fill" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" weight="fill" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" weight="fill" />
    return <span className="text-sm text-muted-foreground w-5 text-center">{rank}</span>
  }

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case "llm":
        return <TextAa className="w-4 h-4 text-blue-400" />
      case "tts":
        return <Microphone className="w-4 h-4 text-cyan-400" />
      case "vlm":
        return <ImageIcon className="w-4 h-4 text-purple-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Model Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Filter by model type:</span>
        <button
          onClick={() => setModelTypeFilter("all")}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            modelTypeFilter === "all" 
              ? "bg-white text-black font-bold" 
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setModelTypeFilter("llm")}
          className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
            modelTypeFilter === "llm" 
              ? "bg-blue-500 text-black font-bold" 
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <TextAa className="w-3 h-3" /> LLM
        </button>
        <button
          onClick={() => setModelTypeFilter("tts")}
          className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
            modelTypeFilter === "tts" 
              ? "bg-cyan-500 text-black font-bold" 
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <Microphone className="w-3 h-3" /> TTS
        </button>
        <button
          onClick={() => setModelTypeFilter("vlm")}
          className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
            modelTypeFilter === "vlm" 
              ? "bg-purple-500 text-black font-bold" 
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <ImageIcon className="w-3 h-3" /> VLM
        </button>
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
              {modelTypeFilter !== "all" && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({modelTypeFilter.toUpperCase()} only)
                </span>
              )}
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
              {modelTypeFilter !== "all" && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({modelTypeFilter.toUpperCase()} only)
                </span>
              )}
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
                    <div className="flex items-center gap-2">
                      {getModelTypeIcon(model.modelType)}
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

// Level gates for leaderboards
export function getLeaderboardUnlocks(playerLevel: number) {
  return {
    weekly: playerLevel >= 5,
    monthly: playerLevel >= 7,
    allTime: playerLevel >= 9,
  }
}
