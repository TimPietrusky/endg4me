"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { PerkTree } from "@/components/game/dashboard/perk-tree"
import type { Id } from "@/convex/_generated/dataModel"

// Research view tabs - RP-only (queue/staff/compute moved to Lab > Upgrades)
// Attributes tab removed per 004_upgrade_points user story
const RESEARCH_TABS = [
  { id: "models", label: "MODELS" },
  { id: "capabilities", label: "CAPABILITIES" },
  { id: "perks", label: "PERKS" },
] as const

type ResearchTab = typeof RESEARCH_TABS[number]["id"]

export default function ResearchPage() {
  const { userId, labState } = useGameData()
  const [activeTab, setActiveTab] = useState<ResearchTab>("models")

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
        {activeTab === "models" && (
          <PerkTree
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            category="models"
          />
        )}

        {activeTab === "capabilities" && (
          <PerkTree
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            category="capabilities"
          />
        )}

        {activeTab === "perks" && (
          <PerkTree
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            category="perks"
          />
        )}
      </div>
    </>
  )
}
