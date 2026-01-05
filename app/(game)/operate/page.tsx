"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { TasksView } from "@/components/game/dashboard/tasks-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import type { Action } from "@/lib/game-types"

export default function OperatePage() {
  const { actions, maxParallelTasks, activeTaskCount, handleStartAction } = useGameData()
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  // Build actionsByCategory for filters
  const actionsByCategory = actions.reduce(
    (acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = []
      }
      acc[action.category].push(action)
      return acc
    },
    {} as Record<string, Action[]>,
  )

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={showActiveOnly}
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          badge={activeTaskCount}
        >
          ACTIVE
        </SubNavButton>
        {Object.keys(actionsByCategory).map((category) => (
          <SubNavButton
            key={category}
            isActive={selectedCategories.includes(category)}
            onClick={() => toggleCategory(category)}
            badge={actionsByCategory[category].length}
          >
            {category}
          </SubNavButton>
        ))}
      </SubNavContainer>

      {/* Main content */}
      <TasksView
        actions={actions}
        showActiveOnly={showActiveOnly}
        selectedCategories={selectedCategories}
        onStartAction={handleStartAction}
      />
    </>
  )
}

