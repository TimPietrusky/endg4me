"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TextAa,
  Microphone,
  Image as ImageIcon,
  ArrowRight
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompact } from "@/lib/utils"
import Link from "next/link"

interface ModelsLeaderboardProps {
  labId: Id<"labs">
}

type ModelTypeFilter = "llm" | "tts" | "vlm"

export function ModelsLeaderboard({ labId }: ModelsLeaderboardProps) {
  const [modelType, setModelType] = useState<ModelTypeFilter>("llm")
  
  const leaderboardData = useQuery(api.leaderboard.getModelLeaderboardSlice, { 
    labId, 
    modelType 
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" weight="fill" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" weight="fill" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" weight="fill" />
    return <span className="text-sm text-muted-foreground w-5 text-center font-mono">{rank}</span>
  }

  const getTypeIcon = (type: ModelTypeFilter) => {
    switch (type) {
      case "llm": return <TextAa className="w-4 h-4" />
      case "tts": return <Microphone className="w-4 h-4" />
      case "vlm": return <ImageIcon className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: ModelTypeFilter) => {
    switch (type) {
      case "llm": return "LLM"
      case "tts": return "TTS"
      case "vlm": return "VLM"
    }
  }

  if (!leaderboardData) {
    return (
      <div className="mt-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading leaderboard...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { rows, myRank, hasPublicModel } = leaderboardData

  return (
    <div className="space-y-4 mt-4">
      {/* Type selector and rank info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Model type buttons */}
          <div className="flex items-center gap-1 bg-muted/30 rounded p-1">
            {(["llm", "tts", "vlm"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setModelType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  modelType === type
                    ? type === "llm" 
                      ? "bg-blue-500 text-black" 
                      : type === "tts"
                        ? "bg-cyan-500 text-black"
                        : "bg-purple-500 text-black"
                    : "hover:bg-muted"
                }`}
              >
                {getTypeIcon(type)}
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {myRank && (
          <span className="text-sm text-muted-foreground">
            Your rank: #{myRank}
          </span>
        )}
      </div>

      {/* Empty state: no public model of this type */}
      {!hasPublicModel && (
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                {getTypeIcon(modelType)}
              </div>
              <p className="text-sm font-medium mb-1">
                No public {getTypeLabel(modelType)} model yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Publish a {getTypeLabel(modelType)} model to get ranked on this leaderboard
              </p>
              <Link
                href="/lab/models"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Go to Lab &gt; Models
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard table */}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No public {getTypeLabel(modelType)} models yet</p>
              <p className="text-xs mt-1">Be the first to publish!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((entry) => (
                <div
                  key={`${entry.labId}-${entry.modelName}`}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    entry.isCurrentPlayer
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/30"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Model type icon */}
                  <div className={`shrink-0 ${
                    modelType === "llm" 
                      ? "text-blue-400" 
                      : modelType === "tts"
                        ? "text-cyan-400"
                        : "text-purple-400"
                  }`}>
                    {getTypeIcon(modelType)}
                  </div>
                  
                  {/* Model info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm truncate ${entry.isCurrentPlayer ? "text-primary" : ""}`}>
                        {entry.modelName}
                      </p>
                      {entry.isCurrentPlayer && (
                        <span className="text-xs text-primary/70">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.labName} · v{entry.version}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
                    <Star className="w-4 h-4" weight="fill" />
                    <span className="font-bold font-mono">{formatCompact(entry.score)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about what's shown */}
      {rows.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {hasPublicModel 
            ? "Showing your neighbors on the leaderboard (20 above, 20 below)"
            : `Showing top ${getTypeLabel(modelType)} models globally`
          }
        </p>
      )}
    </div>
  )
}

