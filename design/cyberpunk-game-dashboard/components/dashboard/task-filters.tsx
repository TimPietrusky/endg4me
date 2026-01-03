"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Action } from "@/lib/game-types"

interface TaskFiltersProps {
  showRunningOnly: boolean
  setShowRunningOnly: (show: boolean) => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void
  actionsByCategory: Record<string, Action[]>
  runningCount: number
}

export function TaskFilters({
  showRunningOnly,
  setShowRunningOnly,
  selectedCategories,
  toggleCategory,
  actionsByCategory,
  runningCount,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowRunningOnly(!showRunningOnly)}
        className={`text-xs rounded-none border-b-4 ${
          showRunningOnly
            ? "border-primary text-primary font-bold"
            : "border-transparent hover:border-muted-foreground/30"
        }`}
      >
        RUNNING
        <Badge variant="secondary" className="ml-2 h-4 px-1.5">
          {runningCount}
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
              ? "border-primary text-primary font-bold"
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
