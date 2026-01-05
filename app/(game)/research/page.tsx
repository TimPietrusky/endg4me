"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { PerkTree } from "@/components/game/dashboard/perk-tree"
import type { Id } from "@/convex/_generated/dataModel"

// Research view tabs
const RESEARCH_TABS = [
  { id: "model", label: "MODELS" },
  { id: "monetization", label: "MONETIZATION" },
  { id: "income", label: "INCOME" },
  { id: "hiring", label: "HIRING" },
  { id: "perk", label: "PERKS" },
] as const

type ResearchTab = typeof RESEARCH_TABS[number]["id"]

export default function ResearchPage() {
  const { userId, labState } = useGameData()
  const [activeTab, setActiveTab] = useState<ResearchTab>("model")

  if (!userId || !labState) {
    return null
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        {RESEARCH_TABS.map((tab, index) => (
          <SubNavButton
            key={tab.id}
            isFirst={index === 0}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </SubNavButton>
        ))}
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
