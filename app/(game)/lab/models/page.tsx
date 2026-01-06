"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { CollectionView } from "@/components/game/dashboard/collection-view"
import type { Id } from "@/convex/_generated/dataModel"

export default function LabModelsPage() {
  const { lab, userId, trainedModels, modelStats } = useGameData()

  if (!lab || !userId) {
    return null
  }

  return (
    <CollectionView
      labName={lab.name}
      userId={userId as Id<"users">}
      models={trainedModels}
      bestScore={modelStats?.bestModel?.score}
      labId={lab._id}
    />
  )
}

