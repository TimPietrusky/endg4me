"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TextAa,
  Microphone,
  Image as ImageIcon,
  ArrowsClockwise,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompact } from "@/lib/utils"

type ModelTypeFilter = "llm" | "tts" | "vlm"

export default function ModelsLeaderboardPage() {
  const { lab } = useGameData()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const typeParam = searchParams.get("type") as ModelTypeFilter | null
  const modelType: ModelTypeFilter = typeParam === "llm" || typeParam === "tts" || typeParam === "vlm" 
    ? typeParam 
    : "tts"

  const setModelType = (type: ModelTypeFilter) => {
    router.push(`/leaderboard/models?type=${type}`)
  }

  const leaderboardData = useQuery(
    api.leaderboard.getBlueprintLeaderboards, 
    lab ? { labId: lab._id, modelType } : "skip"
  )

  const rebuildLeaderboards = useMutation(api.leaderboard.rebuildAllLeaderboards)

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

  if (!lab || !leaderboardData) {
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

  const { blueprints } = leaderboardData

  return (
    <div className="space-y-4 mt-4">
      {/* Type selector */}
      <div className="flex items-center gap-2">
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

      {/* Empty state */}
      {blueprints.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">
                No {getTypeLabel(modelType)} models yet
              </p>
              <p className="text-xs text-muted-foreground">
                Be the first to train one!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blueprint leaderboards */}
      {blueprints.map((blueprint) => (
        <Card key={blueprint.blueprintId}>
          <CardContent className="p-0">
            {/* Blueprint header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className={`${
                  modelType === "llm" 
                    ? "text-blue-400" 
                    : modelType === "tts"
                      ? "text-cyan-400"
                      : "text-purple-400"
                }`}>
                  {getTypeIcon(modelType)}
                </span>
                <span className="font-medium">{blueprint.blueprintName}</span>
              </div>
              {blueprint.myRank && (
                <span className="text-xs text-muted-foreground">
                  Your rank: #{blueprint.myRank} ({blueprint.myScore} pts)
                </span>
              )}
            </div>

            {/* Leaderboard entries */}
            <div className="divide-y divide-border">
              {blueprint.entries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No entries yet
                </div>
              ) : (
                blueprint.entries.map((entry) => (
                  <div
                    key={`${entry.labId}-${blueprint.blueprintId}`}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      entry.isCurrentPlayer
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* Lab info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${entry.isCurrentPlayer ? "text-primary font-medium" : ""}`}>
                          {entry.labName}
                        </p>
                        {entry.isCurrentPlayer && (
                          <span className="text-xs text-primary/70">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        v{entry.version}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
                      <Star className="w-4 h-4" weight="fill" />
                      <span className="font-bold font-mono">{formatCompact(entry.score)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Info */}
      {blueprints.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Each model size has its own leaderboard. Your best model of each size competes.
        </p>
      )}

      {/* Dev: Rebuild leaderboards - always visible for now */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => rebuildLeaderboards({})}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded"
        >
          <ArrowsClockwise className="w-4 h-4" />
          Rebuild Leaderboards
        </button>
      </div>
    </div>
  )
}

