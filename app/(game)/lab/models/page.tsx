"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubSubNav, SubSubNavFilter } from "@/components/game/dashboard/sub-nav"
import { ActionCard } from "@/components/game/dashboard/action-card"
import { ACTION_GRID_CLASSES } from "@/components/game/dashboard/grid-classes"
import { Cube } from "@phosphor-icons/react"
import { getContentById, getContentImageUrl } from "@/convex/lib/contentCatalog"
import type { Action, ActionVersion } from "@/lib/game-types"
import type { Doc } from "@/convex/_generated/dataModel"

type ModelType = "llm" | "tts" | "vlm"

// Map model type to display info
const MODEL_TYPE_INFO = {
  llm: { label: "LLM", color: "text-blue-400" },
  tts: { label: "TTS", color: "text-cyan-400" },
  vlm: { label: "VLM", color: "text-purple-400" },
} as const

export default function LabModelsPage() {
  const { lab, trainedModels } = useGameData()
  const [selectedTypes, setSelectedTypes] = useState<ModelType[]>([])
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null)

  // Use aggregated models query for grouped view
  const aggregatedModels = useQuery(
    api.tasks.getAggregatedModels,
    lab?._id ? { labId: lab._id } : "skip"
  )

  if (!lab) {
    return null
  }

  const toggleType = (type: ModelType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  // Filter aggregated models by selected types (empty = show all)
  const filteredModels = aggregatedModels?.filter((agg) => {
    if (selectedTypes.length === 0) return true
    return selectedTypes.includes(agg.modelType)
  })

  // Type counts for badges
  const llmCount = aggregatedModels?.filter((m) => m.modelType === "llm").length || 0
  const ttsCount = aggregatedModels?.filter((m) => m.modelType === "tts").length || 0
  const vlmCount = aggregatedModels?.filter((m) => m.modelType === "vlm").length || 0

  // Convert aggregated model to Action format
  const aggregatedToAction = (agg: NonNullable<typeof aggregatedModels>[number]): Action => {
    const content = getContentById(agg.blueprintId)
    const image = content ? getContentImageUrl(content) : undefined
    const typeInfo = MODEL_TYPE_INFO[agg.modelType]
    
    // Extract size from name (e.g., "3B TTS" -> "3B")
    const sizeMatch = agg.latestModel.name.match(/^(\d+B)/)
    const size = sizeMatch ? sizeMatch[1] : undefined
    const displayName = size ? agg.latestModel.name.replace(/^\d+B\s*/, "") : agg.latestModel.name

    // Convert all versions to ActionVersion format
    const versions: ActionVersion[] = agg.allVersions.map((v: Doc<"trainedModels">) => ({
      id: v._id,
      version: v.version,
      score: v.score,
      trainedAt: v.trainedAt,
      isBest: v._id === agg.bestModel._id,
    }))

    return {
      id: agg.blueprintId,
      category: "COLLECTION",
      name: displayName,
      description: `${typeInfo.label} model`,
      size,
      cost: 0,
      duration: 0,
      image,
      latestVersion: agg.latestVersion,
      versionCount: agg.versionCount,
      bestScore: agg.bestScore,
      versions,
      publicCount: agg.publicCount,
    }
  }

  // Empty state
  if (!trainedModels || trainedModels.length === 0) {
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
    <div className="mt-2">
      {/* Filter toggles by model type */}
      <SubSubNav>
        <SubSubNavFilter
          label="LLM"
          count={llmCount}
          isActive={selectedTypes.includes("llm")}
          onClick={() => toggleType("llm")}
        />
        <SubSubNavFilter
          label="TTS"
          count={ttsCount}
          isActive={selectedTypes.includes("tts")}
          onClick={() => toggleType("tts")}
        />
        <SubSubNavFilter
          label="VLM"
          count={vlmCount}
          isActive={selectedTypes.includes("vlm")}
          onClick={() => toggleType("vlm")}
        />
      </SubSubNav>

      {/* Model Sections by Type */}
      <div className="space-y-8">
        {/* LLM Section */}
        {(selectedTypes.length === 0 || selectedTypes.includes("llm")) && llmCount > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">LLM</h2>
            <div className={ACTION_GRID_CLASSES}>
              {filteredModels?.filter(agg => agg.modelType === "llm").map((agg) => (
                <ActionCard
                  key={agg.blueprintId}
                  action={aggregatedToAction(agg)}
                  onStartAction={() => {}}
                  expandable
                  isExpanded={expandedBlueprint === agg.blueprintId}
                  onToggleExpand={() => setExpandedBlueprint(
                    expandedBlueprint === agg.blueprintId ? null : agg.blueprintId
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* TTS Section */}
        {(selectedTypes.length === 0 || selectedTypes.includes("tts")) && ttsCount > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">TTS</h2>
            <div className={ACTION_GRID_CLASSES}>
              {filteredModels?.filter(agg => agg.modelType === "tts").map((agg) => (
                <ActionCard
                  key={agg.blueprintId}
                  action={aggregatedToAction(agg)}
                  onStartAction={() => {}}
                  expandable
                  isExpanded={expandedBlueprint === agg.blueprintId}
                  onToggleExpand={() => setExpandedBlueprint(
                    expandedBlueprint === agg.blueprintId ? null : agg.blueprintId
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* VLM Section */}
        {(selectedTypes.length === 0 || selectedTypes.includes("vlm")) && vlmCount > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">VLM</h2>
            <div className={ACTION_GRID_CLASSES}>
              {filteredModels?.filter(agg => agg.modelType === "vlm").map((agg) => (
                <ActionCard
                  key={agg.blueprintId}
                  action={aggregatedToAction(agg)}
                  onStartAction={() => {}}
                  expandable
                  isExpanded={expandedBlueprint === agg.blueprintId}
                  onToggleExpand={() => setExpandedBlueprint(
                    expandedBlueprint === agg.blueprintId ? null : agg.blueprintId
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state when filters active but no matches */}
        {filteredModels?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No models match the current filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

