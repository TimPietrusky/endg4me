"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { LabOverviewHeader } from "@/components/game/dashboard/lab-overview-header"
import { TeamView } from "@/components/game/dashboard/team-view"
import { CollectionView } from "@/components/game/dashboard/collection-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

type LabSubView = "team" | "models"

export default function LabPage() {
  const { 
    user,
    lab, 
    labState,
    trainedModels, 
    modelStats, 
    publicModelCount, 
  } = useGameData()
  
  const [subView, setSubView] = useState<LabSubView>("team")

  if (!lab || !labState || !user) {
    return null
  }

  const totalModels = trainedModels?.length || 0

  return (
    <>
      {/* Lab Overview Header - org card style */}
      <LabOverviewHeader
        labName={lab.name}
        founderType={lab.founderType}
        totalModels={totalModels}
        publicModelsCount={publicModelCount}
        staffCount={labState.juniorResearchers}
        staffCapacity={labState.staffCapacity}
      />

      {/* SubNav: Team | Models - stable, no jumping */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={subView === "team"}
          onClick={() => setSubView("team")}
        >
          TEAM
        </SubNavButton>
        <SubNavButton
          isActive={subView === "models"}
          onClick={() => setSubView("models")}
          badge={totalModels}
        >
          MODELS
        </SubNavButton>
      </SubNavContainer>

      {/* Content */}
      {subView === "team" && (
        <TeamView
          founderName={user.name || user.email}
          founderType={lab.founderType}
          juniorResearchers={labState.juniorResearchers}
        />
      )}

      {subView === "models" && (
        <CollectionView
          labName={lab.name}
          models={trainedModels}
          bestScore={modelStats?.bestModel?.score}
        />
      )}
    </>
  )
}
