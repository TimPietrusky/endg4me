"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  return (
    <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-white/20 sticky top-[73px] z-40 bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowActiveOnly(!showActiveOnly)}
        className={`text-xs rounded-none border-b-4 ${
          showActiveOnly
            ? "border-white text-white font-bold"
            : "border-transparent hover:border-muted-foreground/30"
        }`}
      >
        ACTIVE
        <Badge variant="secondary" className="ml-2 h-4 px-1.5">
          {activeCount}/{maxParallelTasks}
        </Badge>
      </Button>
      {Object.keys(actionsByCategory).map((category) => (
        <Button
          key={category}
          variant="ghost"
          size="sm"
          onClick={() => toggleCategory(category)}
          className={`text-xs rounded-none border-b-4 ${
            selectedCategories.includes(category)
              ? "border-white text-white font-bold"
              : "border-transparent hover:border-muted-foreground/30"
          }`}
        >
          {category}
          <Badge variant="secondary" className="ml-2 h-4 px-1.5">
            {actionsByCategory[category].length}
          </Badge>
        </Button>
      ))}
    </div>
  )
}

