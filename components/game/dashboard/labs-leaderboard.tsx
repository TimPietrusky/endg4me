"use client"

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
  Info
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCompact } from "@/lib/utils"

interface LabsLeaderboardProps {
  labId: Id<"labs">
}

export function LabsLeaderboard({ labId }: LabsLeaderboardProps) {
  const leaderboardData = useQuery(api.leaderboard.getLabLeaderboardSlice, { labId })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" weight="fill" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" weight="fill" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" weight="fill" />
    return <span className="text-sm text-muted-foreground w-5 text-center font-mono">{rank}</span>
  }

  const getModelBadge = (type: "llm" | "tts" | "vlm", score?: number) => {
    if (!score) return null
    
    const icons = {
      llm: <TextAa className="w-3 h-3" />,
      tts: <Microphone className="w-3 h-3" />,
      vlm: <ImageIcon className="w-3 h-3" />
    }
    
    const colors = {
      llm: "text-blue-400 bg-blue-400/10",
      tts: "text-cyan-400 bg-cyan-400/10",
      vlm: "text-purple-400 bg-purple-400/10"
    }

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${colors[type]}`}>
        {icons[type]} {score}
      </span>
    )
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

  const { rows, myRank } = leaderboardData

  return (
    <div className="space-y-4 mt-4">
      {/* Header with score explanation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-medium">Labs Leaderboard</span>
          {myRank && (
            <span className="text-sm text-muted-foreground">
              (Your rank: #{myRank})
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-4 h-4" />
              How score works
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">Lab Score Formula</p>
              <p className="text-xs text-muted-foreground">
                Score = (Level x 100) + Best Public Models + (Upgrades x 20)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only public models count toward your score.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Leaderboard table */}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No labs on the leaderboard yet</p>
              <p className="text-xs mt-1">Complete tasks and publish models to get ranked!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((entry) => (
                <div
                  key={entry.labId}
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
                  
                  {/* Lab info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm truncate ${entry.isCurrentPlayer ? "text-primary" : ""}`}>
                        {entry.labName}
                      </p>
                      {entry.isCurrentPlayer && (
                        <span className="text-xs text-primary/70">(you)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Level {entry.level}
                      </span>
                      {/* Model badges */}
                      <div className="flex items-center gap-1">
                        {getModelBadge("llm", entry.bestPublicScores.llm)}
                        {getModelBadge("tts", entry.bestPublicScores.tts)}
                        {getModelBadge("vlm", entry.bestPublicScores.vlm)}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5 text-amber-400 shrink-0">
                    <Star className="w-4 h-4" weight="fill" />
                    <span className="font-bold font-mono">{formatCompact(entry.labScore)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about neighbors slice */}
      {rows.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Showing your neighbors on the leaderboard (20 above, 20 below)
        </p>
      )}
    </div>
  )
}

