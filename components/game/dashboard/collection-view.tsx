"use client"

import { useState } from "react"
import { 
  Cube, 
  Brain, 
  Trophy, 
  Star, 
  Microphone,
  Image as ImageIcon,
  TextAa,
  CaretDown,
  CaretUp,
  Stack
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { formatCompact } from "@/lib/utils"

export type ModelTypeFilter = "all" | "llm" | "tts" | "vlm"

// Aggregated model type from the query
interface AggregatedModel {
  blueprintId: string
  modelType: "llm" | "tts" | "vlm"
  latestVersion: number
  latestModel: Doc<"trainedModels">
  bestScore: number
  bestModel: Doc<"trainedModels">
  versionCount: number
  publicCount: number
  allVersions: Doc<"trainedModels">[]
}

interface CollectionViewProps {
  labName: string
  userId: Id<"users">
  models?: Doc<"trainedModels">[]
  bestScore?: number
  labId?: Id<"labs">
}

export function CollectionView({ labName, userId, models, bestScore, labId }: CollectionViewProps) {
  const [typeFilter, setTypeFilter] = useState<ModelTypeFilter>("all")
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null)

  // Use aggregated models query for grouped view
  const aggregatedModels = useQuery(
    api.tasks.getAggregatedModels,
    labId ? { labId } : "skip"
  )

  // Filter aggregated models by type
  const filteredAggregated = aggregatedModels?.filter((agg) => {
    if (typeFilter !== "all" && agg.modelType !== typeFilter) return false
    return true
  })

  // Stats
  const totalVersions = models?.length || 0
  const uniqueModels = aggregatedModels?.length || 0

  // Type counts (unique blueprints)
  const llmCount = aggregatedModels?.filter((m) => m.modelType === "llm").length || 0
  const ttsCount = aggregatedModels?.filter((m) => m.modelType === "tts").length || 0
  const vlmCount = aggregatedModels?.filter((m) => m.modelType === "vlm").length || 0

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

  return (
    <div className="space-y-4 mt-4">
      {/* Stats Header */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-card/50 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" weight="bold" />
          </div>
          <div>
            <p className="text-2xl font-bold">{uniqueModels}</p>
            <p className="text-sm text-muted-foreground">models</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
            <Stack className="w-6 h-6 text-white" weight="bold" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalVersions}</p>
            <p className="text-sm text-muted-foreground">versions</p>
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
      </div>

      {/* Type Filter Chips */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              typeFilter === "all" 
                ? "bg-white text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            All Types ({uniqueModels})
          </button>
          <button
            onClick={() => setTypeFilter("llm")}
            className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              typeFilter === "llm" 
                ? "bg-blue-500 text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <TextAa className="w-3 h-3" /> LLM ({llmCount})
          </button>
          <button
            onClick={() => setTypeFilter("tts")}
            className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              typeFilter === "tts" 
                ? "bg-cyan-500 text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Microphone className="w-3 h-3" /> TTS ({ttsCount})
          </button>
          <button
            onClick={() => setTypeFilter("vlm")}
            className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              typeFilter === "vlm" 
                ? "bg-purple-500 text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <ImageIcon className="w-3 h-3" /> VLM ({vlmCount})
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2">
        <Trophy className="w-4 h-4 text-green-400 flex-shrink-0" weight="fill" />
        <span className="text-white/70">
          Best-scoring version of each model competes on the leaderboard.
        </span>
      </div>

      {/* Model Grid - grouped by blueprint */}
      {filteredAggregated && filteredAggregated.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAggregated.map((agg) => (
            <AggregatedModelCard 
              key={agg.blueprintId} 
              aggregated={agg}
              isExpanded={expandedBlueprint === agg.blueprintId}
              onToggleExpand={() => setExpandedBlueprint(
                expandedBlueprint === agg.blueprintId ? null : agg.blueprintId
              )}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No models match the current filters</p>
        </div>
      )}
    </div>
  )
}

// Helper functions for model display
function getModelTypeIcon(type: string) {
  switch (type) {
    case "llm":
      return <TextAa className="w-5 h-5 text-blue-400" weight="bold" />
    case "tts":
      return <Microphone className="w-5 h-5 text-cyan-400" weight="bold" />
    case "vlm":
      return <ImageIcon className="w-5 h-5 text-purple-400" weight="bold" />
    default:
      return <Brain className="w-5 h-5 text-primary" weight="bold" />
  }
}

function getModelTypeName(type: string) {
  switch (type) {
    case "llm":
      return "LLM"
    case "tts":
      return "TTS"
    case "vlm":
      return "VLM"
    default:
      return "Unknown"
  }
}

function getModelColor(type: string) {
  switch (type) {
    case "llm":
      return "from-blue-500/20 to-blue-500/5 border-blue-500/30"
    case "tts":
      return "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30"
    case "vlm":
      return "from-purple-500/20 to-purple-500/5 border-purple-500/30"
    default:
      return "from-gray-500/20 to-gray-500/5 border-gray-500/30"
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Aggregated Model Card - shows one card per blueprint with version count
interface AggregatedModelCardProps {
  aggregated: AggregatedModel
  isExpanded: boolean
  onToggleExpand: () => void
}

function AggregatedModelCard({ aggregated, isExpanded, onToggleExpand }: Omit<AggregatedModelCardProps, 'onToggleVisibility'>) {
  const { latestModel, bestScore, bestModel, versionCount, allVersions, modelType } = aggregated

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${getModelColor(modelType)}`}>
      <CardContent className="p-4">
        {/* Header with type, version count, and best score */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getModelTypeIcon(modelType)}
            <div>
              <span className="font-bold">{getModelTypeName(modelType)}</span>
              <span className="text-xs text-muted-foreground ml-1">v{latestModel.version}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Version count badge */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs">
              <Stack className="w-3 h-3" />
              <span>{versionCount}</span>
            </div>
            {/* Best score */}
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4" weight="fill" />
              <span className="text-sm font-bold">{bestScore}</span>
            </div>
          </div>
        </div>

        {/* Model name from blueprint */}
        <p className="text-sm font-medium mb-1">{latestModel.name}</p>
        <p className="text-xs text-muted-foreground mb-3">
          Latest: {formatDate(latestModel.trainedAt)}
        </p>

        {/* Leaderboard status - best version competes */}
        <div className="mb-3 p-2 rounded text-xs flex items-center gap-2 bg-green-500/10 border border-green-500/20">
          <Trophy className="w-4 h-4 text-green-400" weight="fill" />
          <span className="text-green-400">v{bestModel.version} competes (score {bestScore})</span>
        </div>
        
        {/* Expand/Collapse button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <>
              <CaretUp className="w-3 h-3 mr-1" />
              Hide {versionCount} version{versionCount > 1 ? "s" : ""}
            </>
          ) : (
            <>
              <CaretDown className="w-3 h-3 mr-1" />
              Show {versionCount} version{versionCount > 1 ? "s" : ""}
            </>
          )}
        </Button>

        {/* Expanded version list */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {allVersions.map((version) => (
              <VersionRow 
                key={version._id} 
                model={version}
                isBest={version._id === bestModel._id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version row for expanded view
interface VersionRowProps {
  model: Doc<"trainedModels">
  isBest: boolean
}

function VersionRow({ model, isBest }: VersionRowProps) {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${
      isBest ? "bg-green-500/10 border border-green-500/20" : "bg-black/20"
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">v{model.version}</span>
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3" weight="fill" />
          <span className="text-xs font-bold">{model.score}</span>
        </div>
        {isBest && (
          <span className="text-xs text-green-400 font-medium">BEST</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{formatDate(model.trainedAt)}</span>
    </div>
  )
}


