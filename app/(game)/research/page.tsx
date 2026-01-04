"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { AttributesPanel } from "@/components/game/dashboard/attributes-panel"
import { PerkTree } from "@/components/game/dashboard/perk-tree"
import type { Id } from "@/convex/_generated/dataModel"
import { 
  Hexagon, 
  Brain, 
  Wrench, 
  Sparkle 
} from "@phosphor-icons/react"

// Research view tabs
const RESEARCH_TABS = [
  { id: "attributes", label: "ATTRIBUTES", icon: Hexagon },
  { id: "blueprints", label: "BLUEPRINTS", icon: Brain },
  { id: "capabilities", label: "CAPABILITIES", icon: Wrench },
  { id: "perks", label: "PERKS", icon: Sparkle },
] as const

type ResearchTab = typeof RESEARCH_TABS[number]["id"]

export default function ResearchPage() {
  const { userId, labState } = useGameData()
  const [activeTab, setActiveTab] = useState<ResearchTab>("attributes")

  if (!userId || !labState) {
    return null
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        {RESEARCH_TABS.map((tab, index) => {
          const Icon = tab.icon
          return (
            <SubNavButton
              key={tab.id}
              isFirst={index === 0}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </SubNavButton>
          )
        })}
      </SubNavContainer>

      {/* Main content */}
      <div className="px-6 pb-6">
        {activeTab === "attributes" && (
          <AttributesPanel
            userId={userId as Id<"users">}
            currentRp={labState.researchPoints}
            queueSlots={labState.parallelTasks}
            staffCapacity={labState.staffCapacity}
            computeUnits={labState.computeUnits}
            researchSpeedBonus={labState.researchSpeedBonus || 0}
            moneyMultiplier={labState.moneyMultiplier || 1.0}
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
