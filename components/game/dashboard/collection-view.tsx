"use client"

import { Cube, Brain, Trophy, Star } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import type { Doc } from "@/convex/_generated/dataModel"

interface CollectionViewProps {
  models?: Doc<"trainedModels">[]
  bestScore?: number
}

export function CollectionView({ models, bestScore }: CollectionViewProps) {
  if (!models || models.length === 0) {
    return (
      <div className="text-center py-16">
        <Cube className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="text-lg font-bold mb-2">Model Collection</h3>
        <p className="text-sm text-muted-foreground">Your trained models will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center gap-6 p-4 bg-card/50 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" weight="bold" />
          </div>
          <div>
            <p className="text-2xl font-bold">{models.length}</p>
            <p className="text-sm text-muted-foreground">models trained</p>
          </div>
        </div>
        {bestScore !== undefined && bestScore > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bestScore.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">best score</p>
            </div>
          </div>
        )}
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <ModelCard key={model._id} model={model} />
        ))}
      </div>
    </div>
  )
}

function ModelCard({ model }: { model: Doc<"trainedModels"> }) {
  const getModelSize = (type: string) => {
    if (type === "small_3b") return "3B"
    if (type === "medium_7b") return "7B"
    return "?"
  }

  const getModelColor = (type: string) => {
    if (type === "medium_7b") return "from-purple-500/20 to-purple-500/5 border-purple-500/30"
    return "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30"
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${getModelColor(model.modelType)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" weight="bold" />
            <span className="font-bold">{getModelSize(model.modelType)}</span>
          </div>
          {model.score && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4" weight="fill" />
              <span className="text-sm font-bold">{model.score}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1 font-medium">{model.name}</p>
        <p className="text-xs text-muted-foreground">
          Trained {formatDate(model.trainedAt)}
        </p>
      </CardContent>
    </Card>
  )
}

