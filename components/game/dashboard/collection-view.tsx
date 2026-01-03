"use client"

import { Cube, Brain, Trophy, Star, Eye, EyeSlash, GlobeHemisphereWest, Lock } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { formatCompact } from "@/lib/utils"

export type VisibilityFilter = "all" | "public" | "private"

interface CollectionViewProps {
  labName: string
  models?: Doc<"trainedModels">[]
  bestScore?: number
  visibilityFilter: VisibilityFilter
}

export function CollectionView({ labName, models, bestScore, visibilityFilter }: CollectionViewProps) {
  const toggleVisibility = useMutation(api.tasks.toggleModelVisibility)

  // Filter models by visibility
  const filteredModels = models?.filter((model) => {
    if (visibilityFilter === "all") return true
    if (visibilityFilter === "public") return model.visibility === "public"
    if (visibilityFilter === "private") return model.visibility !== "public"
    return true
  })

  const publicCount = models?.filter((m) => m.visibility === "public").length || 0
  const privateCount = models?.filter((m) => m.visibility !== "public").length || 0

  if (!models || models.length === 0) {
    return (
      <div className="text-center py-16 mt-4">
        <Cube className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="text-lg font-bold mb-2">Model Collection</h3>
        <p className="text-sm text-muted-foreground">Your trained models will appear here</p>
        <p className="text-xs text-muted-foreground mt-2">Run training jobs in Operate to create models</p>
      </div>
    )
  }

  const handleToggleVisibility = async (modelId: Id<"trainedModels">) => {
    try {
      await toggleVisibility({ modelId })
    } catch (error) {
      console.error("Failed to toggle visibility:", error)
    }
  }

  return (
    <div className="space-y-6 mt-4">
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
              <p className="text-2xl font-bold">{formatCompact(bestScore)}</p>
              <p className="text-sm text-muted-foreground">best score</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <GlobeHemisphereWest className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-bold">{publicCount}</p>
            <p className="text-sm text-muted-foreground">public</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-bold">{privateCount}</p>
            <p className="text-sm text-muted-foreground">private</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
        <GlobeHemisphereWest className="inline w-4 h-4 mr-2 text-primary" />
        Public models appear on leaderboards and your public lab profile in World.
      </div>

      {/* Model Grid */}
      {filteredModels && filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <ModelCard 
              key={model._id} 
              model={model} 
              onToggleVisibility={() => handleToggleVisibility(model._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No {visibilityFilter} models found</p>
        </div>
      )}
    </div>
  )
}

interface ModelCardProps {
  model: Doc<"trainedModels">
  onToggleVisibility: () => void
}

function ModelCard({ model, onToggleVisibility }: ModelCardProps) {
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

  const isPublic = model.visibility === "public" // undefined = private

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
        <p className="text-xs text-muted-foreground mb-3">
          Trained {formatDate(model.trainedAt)}
        </p>
        
        {/* Visibility Toggle */}
        <Button
          variant={isPublic ? "default" : "outline"}
          size="sm"
          className="w-full text-xs h-7"
          onClick={onToggleVisibility}
        >
          {isPublic ? (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Public
            </>
          ) : (
            <>
              <EyeSlash className="w-3 h-3 mr-1" />
              Private
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
