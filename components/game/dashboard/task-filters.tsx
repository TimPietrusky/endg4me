"use client"

import { SubNavContainer, SubNavButton } from "./sub-nav"
import type { Action } from "@/lib/game-types"

interface TaskFiltersProps {
  showActiveOnly: boolean
  setShowActiveOnly: (show: boolean) => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void
  actionsByCategory: Record<string, Action[]>
  activeCount: number
  maxParallelTasks: number
}

export function TaskFilters({
  showActiveOnly,
  setShowActiveOnly,
  selectedCategories,
  toggleCategory,
  actionsByCategory,
  activeCount,
  maxParallelTasks,
}: TaskFiltersProps) {
  const categories = Object.keys(actionsByCategory)

  return (
    <SubNavContainer>
      <SubNavButton
        isFirst
        isActive={showActiveOnly}
        onClick={() => setShowActiveOnly(!showActiveOnly)}
        badge={`${activeCount}/${maxParallelTasks}`}
      >
        ACTIVE
      </SubNavButton>
      {categories.map((category) => (
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
  )
}
