"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { ResearchView, RESEARCH_CATEGORIES, type ResearchCategory } from "@/components/game/dashboard/research-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import type { Id } from "@/convex/_generated/dataModel"

export default function ResearchPage() {
  const { userId, labState } = useGameData()
  const [selectedCategory, setSelectedCategory] = useState<ResearchCategory | null>(null)

  if (!userId || !labState) {
    return null
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        {RESEARCH_CATEGORIES.map((category, index) => (
          <SubNavButton
            key={category}
            isFirst={index === 0}
            isActive={selectedCategory === category}
            onClick={() => setSelectedCategory(
              selectedCategory === category ? null : category
            )}
          >
            {category.toUpperCase()}
          </SubNavButton>
        ))}
      </SubNavContainer>

      {/* Main content */}
      <ResearchView
        userId={userId as Id<"users">}
        currentRp={labState.researchPoints}
        selectedCategory={selectedCategory}
      />
    </>
  )
}

