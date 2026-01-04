"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { CollectionView, type VisibilityFilter } from "@/components/game/dashboard/collection-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

export default function LabPage() {
  const { lab, trainedModels, modelStats, publicModelCount, privateModelCount } = useGameData()
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all")

  if (!lab) {
    return null
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={visibilityFilter === "public"}
          onClick={() => setVisibilityFilter(
            visibilityFilter === "public" ? "all" : "public"
          )}
          badge={publicModelCount}
        >
          PUBLIC
        </SubNavButton>
        <SubNavButton
          isActive={visibilityFilter === "private"}
          onClick={() => setVisibilityFilter(
            visibilityFilter === "private" ? "all" : "private"
          )}
          badge={privateModelCount}
        >
          PRIVATE
        </SubNavButton>
      </SubNavContainer>

      {/* Main content */}
      <CollectionView
        labName={lab.name}
        models={trainedModels}
        bestScore={modelStats?.bestModel?.score}
        visibilityFilter={visibilityFilter}
      />
    </>
  )
}

