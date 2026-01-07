"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { PerkTree } from "@/components/game/dashboard/perk-tree"
import type { Id } from "@/convex/_generated/dataModel"

// Research view tabs
const RESEARCH_TABS = [
  { id: "model", label: "MODELS" },
  { id: "revenue", label: "REVENUE" },
  { id: "hiring", label: "HIRING" },
] as const

type ResearchTab = typeof RESEARCH_TABS[number]["id"]

export default function ResearchPage() {
  const { userId, labState } = useGameData()
  const [activeTab, setActiveTab] = useState<ResearchTab>("model")
  
  // Get research tree state to compute counts
  const researchState = useQuery(
    api.research.getResearchTreeState, 
    userId ? { userId: userId as Id<"users"> } : "skip"
  )

  if (!userId || !labState) {
    return null
  }

  // Count available (not purchased, not locked) items per category
  const getCategoryCount = (category: ResearchTab): number => {
    if (!researchState?.nodes) return 0
    return researchState.nodes.filter(
      node => node.category === category && !node.isPurchased && !node.isLocked
    ).length
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        {RESEARCH_TABS.map((tab, index) => {
          const count = getCategoryCount(tab.id)
          return (
            <SubNavButton
              key={tab.id}
              isFirst={index === 0}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              badge={count > 0 ? count : undefined}
            >
              {tab.label}
            </SubNavButton>
          )
        })}
      </SubNavContainer>

      {/* Main content */}
      <div>
        <PerkTree
          userId={userId as Id<"users">}
          currentRp={labState.researchPoints}
          category={activeTab}
        />
      </div>
    </>
  )
}
