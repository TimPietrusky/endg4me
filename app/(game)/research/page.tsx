"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { AttributesPanel } from "@/components/game/dashboard/attributes-panel"
import { PerkTree } from "@/components/game/dashboard/perk-tree"
import type { Id } from "@/convex/_generated/dataModel"

// Research view tabs - no icons, clean text only
const RESEARCH_TABS = [
  { id: "attributes", label: "ATTRIBUTES" },
  { id: "blueprints", label: "BLUEPRINTS" },
  { id: "capabilities", label: "CAPABILITIES" },
  { id: "perks", label: "PERKS" },
] as const

type ResearchTab = typeof RESEARCH_TABS[number]["id"]

export default function ResearchPage() {
  const { userId, lab, labState, playerState } = useGameData()
  const [activeTab, setActiveTab] = useState<ResearchTab>("attributes")

  if (!userId || !labState || !lab) {
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
        {activeTab === "attributes" && (
          <AttributesPanel
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            queueSlots={labState.parallelTasks}
            staffCapacity={labState.staffCapacity}
            computeUnits={labState.computeUnits}
            researchSpeedBonus={labState.researchSpeedBonus || 0}
            moneyMultiplier={labState.moneyMultiplier || 1.0}
            founderType={lab.founderType}
            juniorResearchers={labState.juniorResearchers}
            playerLevel={playerState?.level || 1}
          />
        )}

        {activeTab === "blueprints" && (
          <PerkTree
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            category="blueprints"
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
