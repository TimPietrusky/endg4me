"use client"

import { Star } from "@phosphor-icons/react"
import { ActionCard } from "./action-card"
import type { Action } from "@/lib/game-types"

interface TasksViewProps {
  actions: Action[]
  showActiveOnly: boolean
  selectedCategories: string[]
  onStartAction: (action: Action) => void
}

export function TasksView({
  actions,
  showActiveOnly,
  selectedCategories,
  onStartAction,
}: TasksViewProps) {
  const hasActiveFilters = selectedCategories.length > 0 || showActiveOnly

  const filteredActions = actions.filter((action) => {
    if (!hasActiveFilters) {
      return true
    }

    const hasCategoryFilters = selectedCategories.length > 0
    const categoryMatch = hasCategoryFilters ? selectedCategories.includes(action.category) : true

    const activeMatch = showActiveOnly ? action.isActive : true

    return categoryMatch && activeMatch
  })

  const filteredByCategory = filteredActions.reduce(
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
    <div>
      {Object.keys(filteredByCategory).length === 0 ? (
        <div className="text-center py-16 mt-4">
          <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-bold mb-2">No Tasks Found</h3>
          <p className="text-sm text-muted-foreground">
            {showActiveOnly ? "No tasks are currently active" : "Adjust your filters to see tasks"}
          </p>
        </div>
      ) : (
        Object.entries(filteredByCategory).map(([category, categoryActions]) => (
          <div key={category} id={category.toLowerCase()} className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {categoryActions.map((action) => (
                <ActionCard key={action.id} action={action} onStartAction={onStartAction} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
