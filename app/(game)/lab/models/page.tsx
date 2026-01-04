"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { CollectionView } from "@/components/game/dashboard/collection-view"

export default function LabModelsPage() {
  const { lab, trainedModels, modelStats } = useGameData()

  if (!lab) {
    return null
  }

  return (
    <CollectionView
      labName={lab.name}
      models={trainedModels}
      bestScore={modelStats?.bestModel?.score}
    />
  )
}

