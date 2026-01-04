"use client"

import { useState } from "react"
import { 
  Cube, 
  Brain, 
  Trophy, 
  Star, 
  Eye, 
  EyeSlash, 
  GlobeHemisphereWest, 
  Lock,
  SortAscending,
  CheckCircle,
  XCircle,
  Microphone,
  Image as ImageIcon,
  TextAa
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { formatCompact } from "@/lib/utils"

export type VisibilityFilter = "all" | "public" | "private"
export type ModelTypeFilter = "all" | "llm" | "tts" | "vlm"
export type SortOption = "newest" | "oldest" | "highest_score" | "lowest_score"

interface CollectionViewProps {
  labName: string
  userId: Id<"users">
  models?: Doc<"trainedModels">[]
  bestScore?: number
}

export function CollectionView({ labName, userId, models, bestScore }: CollectionViewProps) {
  const toggleVisibility = useMutation(api.tasks.toggleModelVisibility)
  const playerUnlocks = useQuery(api.research.getPlayerUnlocks, { userId })
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all")
  const [typeFilter, setTypeFilter] = useState<ModelTypeFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const publishingUnlocked = playerUnlocks?.enabledSystemFlags?.includes("publishing") ?? false

  // Filter models by visibility and type
  let filteredModels = models?.filter((model) => {
    // Visibility filter
    if (visibilityFilter === "public" && model.visibility !== "public") return false
    if (visibilityFilter === "private" && model.visibility === "public") return false
    // Type filter
    if (typeFilter !== "all" && model.modelType !== typeFilter) return false
    return true
  })

  // Sort models
  if (filteredModels) {
    filteredModels = [...filteredModels].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return b.trainedAt - a.trainedAt
        case "oldest":
          return a.trainedAt - b.trainedAt
        case "highest_score":
          return (b.score || 0) - (a.score || 0)
        case "lowest_score":
          return (a.score || 0) - (b.score || 0)
        default:
          return 0
      }
    })
  }

  const publicCount = models?.filter((m) => m.visibility === "public").length || 0
  const privateCount = models?.filter((m) => m.visibility !== "public").length || 0
  const llmCount = models?.filter((m) => m.modelType === "llm").length || 0
  const ttsCount = models?.filter((m) => m.modelType === "tts").length || 0
  const vlmCount = models?.filter((m) => m.modelType === "vlm").length || 0

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
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error?.message || error)
    }
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

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Visibility Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisibilityFilter("all")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              visibilityFilter === "all" 
                ? "bg-white text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            All ({models?.length || 0})
          </button>
          <button
            onClick={() => setVisibilityFilter("public")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              visibilityFilter === "public" 
                ? "bg-green-500 text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Public ({publicCount})
          </button>
          <button
            onClick={() => setVisibilityFilter("private")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              visibilityFilter === "private" 
                ? "bg-white/60 text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Private ({privateCount})
          </button>
        </div>

        <span className="text-white/20">|</span>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              typeFilter === "all" 
                ? "bg-white text-black font-bold" 
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            All Types
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

        {/* Sort Dropdown - pushed to right */}
        <div className="flex items-center gap-2 ml-auto">
          <SortAscending className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/40"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_score">Highest Score</option>
            <option value="lowest_score">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Info Banner */}
      {publishingUnlocked ? (
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2">
          <GlobeHemisphereWest className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-white/70">
            Public models are eligible for leaderboards and visible on your public lab profile.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-amber-200/70">
            Publishing locked. Research &quot;Model Publishing&quot; to publish models and compete on leaderboards.
          </span>
        </div>
      )}

      {/* Model Grid */}
      {filteredModels && filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <ModelCard 
              key={model._id} 
              model={model} 
              publishingUnlocked={publishingUnlocked}
              onToggleVisibility={() => handleToggleVisibility(model._id)}
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

interface ModelCardProps {
  model: Doc<"trainedModels">
  publishingUnlocked: boolean
  onToggleVisibility: () => void
}

function ModelCard({ model, publishingUnlocked, onToggleVisibility }: ModelCardProps) {
  const getModelTypeIcon = (type: string) => {
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

  const getModelTypeName = (type: string) => {
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

  const getModelColor = (type: string) => {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isPublic = model.visibility === "public"

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${getModelColor(model.modelType)}`}>
      <CardContent className="p-4">
        {/* Header with type and score */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getModelTypeIcon(model.modelType)}
            <div>
              <span className="font-bold">{getModelTypeName(model.modelType)}</span>
              <span className="text-xs text-muted-foreground ml-1">v{model.version}</span>
            </div>
          </div>
          {model.score && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4" weight="fill" />
              <span className="text-sm font-bold">{model.score}</span>
            </div>
          )}
        </div>

        {/* Model name and timestamp */}
        <p className="text-sm font-medium mb-1">{model.name}</p>
        <p className="text-xs text-muted-foreground mb-3">
          Trained {formatDate(model.trainedAt)}
        </p>

        {/* Leaderboard Eligibility */}
        <div className={`mb-3 p-2 rounded text-xs flex items-center gap-2 ${
          isPublic 
            ? "bg-green-500/10 border border-green-500/20" 
            : "bg-white/5 border border-white/10"
        }`}>
          {isPublic ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" weight="fill" />
              <span className="text-green-400">Leaderboard Eligible</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Not Eligible (private)</span>
            </>
          )}
        </div>
        
        {/* Visibility Toggle */}
        {publishingUnlocked ? (
          <Button
            variant={isPublic ? "default" : "outline"}
            size="sm"
            className="w-full text-xs h-8"
            onClick={onToggleVisibility}
          >
            {isPublic ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Public - Click to make Private
              </>
            ) : (
              <>
                <EyeSlash className="w-3 h-3 mr-1" />
                Private - Click to Publish
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 opacity-50"
            disabled
          >
            <Lock className="w-3 h-3 mr-1" />
            Publishing Locked
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
