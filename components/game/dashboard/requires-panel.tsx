"use client"

import { useRouter } from "next/navigation"
import { CurrencyDollar, Cpu, Lightning } from "@phosphor-icons/react"
import type { ActionRequirement, ViewType } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface RequiresPanelProps {
  requirements: ActionRequirement[]
  className?: string
  /** Callback when a navigable requirement is clicked */
  onNavigate?: (link: { view: ViewType; target?: string }) => void
}

// Icon mapping for requirement types
// Research and model types don't get icons - they show the model name directly
const REQUIREMENT_ICONS: Record<ActionRequirement['type'], typeof Lightning | null> = {
  research: null, // shows model name directly, no icon
  level: null, // uses text "lvl"
  compute: Cpu,
  money: CurrencyDollar,
  model: null, // shows model name directly
}

// Format requirement for display
function formatRequirement(req: ActionRequirement): string {
  switch (req.type) {
    case 'level':
      return `lvl ${req.label}`
    case 'money':
      // Don't add $ prefix - the icon handles it
      return req.label
    case 'compute':
      return `cu ${req.label}`
    case 'research':
      return req.label
    case 'model':
      return req.label
    default:
      return req.label
  }
}

// Single requirement item
function RequirementItem({ 
  requirement, 
  onNavigate 
}: { 
  requirement: ActionRequirement
  onNavigate?: (link: { view: ViewType; target?: string }) => void
}) {
  const Icon = REQUIREMENT_ICONS[requirement.type]
  const isClickable = requirement.navigable && requirement.link && onNavigate
  
  const content = (
    <span className={cn(
      "flex items-center gap-1",
      isClickable && "group-hover:underline"
    )}>
      {Icon && <Icon weight="bold" className="w-3 h-3" />}
      <span>{formatRequirement(requirement)}</span>
    </span>
  )

  if (isClickable) {
    return (
      <button
        onClick={() => onNavigate(requirement.link!)}
        className="group text-red-400 hover:text-red-300 transition-colors cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return <span className="text-red-400">{content}</span>
}

/**
 * Unified panel showing unmet requirements for an action.
 * Replaces various "missing/blocked" displays with a single consistent format.
 * 
 * Order: research -> level -> compute -> money
 */
export function RequiresPanel({ requirements, className, onNavigate }: RequiresPanelProps) {
  const router = useRouter()
  
  // Filter to unmet requirements only
  const unmetRequirements = requirements.filter(r => !r.met)
  
  // Sort by type priority: research -> level -> compute -> money -> model
  const sortOrder: Record<ActionRequirement['type'], number> = {
    research: 0,
    level: 1,
    compute: 2,
    money: 3,
    model: 4,
  }
  const sorted = [...unmetRequirements].sort((a, b) => sortOrder[a.type] - sortOrder[b.type])
  
  if (sorted.length === 0) return null

  const handleNavigate = onNavigate || ((link: { view: ViewType; target?: string }) => {
    // Default navigation behavior
    const path = link.target ? `/${link.view}?target=${link.target}` : `/${link.view}`
    router.push(path)
  })

  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-[72px] border-b border-white/10 bg-card",
      className
    )}>
      <span className="text-xs font-bold text-muted-foreground lowercase mb-1">requires</span>
      <div className="flex items-center text-sm font-medium">
        {sorted.map((req, i) => (
          <span key={`${req.type}-${i}`} className="flex items-center">
            {i > 0 && <span className="mx-2 text-white/20">|</span>}
            <RequirementItem 
              requirement={req} 
              onNavigate={handleNavigate}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact inline version for use in other contexts (e.g. details modal)
 */
export function RequirementsList({ 
  requirements,
  showAll = false,
  className 
}: { 
  requirements: ActionRequirement[]
  showAll?: boolean // show all requirements with met/unmet status
  className?: string
}) {
  const router = useRouter()
  
  const items = showAll ? requirements : requirements.filter(r => !r.met)
  
  if (items.length === 0) return null

  const handleNavigate = (link: { view: ViewType; target?: string }) => {
    const path = link.target ? `/${link.view}?target=${link.target}` : `/${link.view}`
    router.push(path)
  }

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((req, i) => {
        const Icon = REQUIREMENT_ICONS[req.type]
        const isClickable = req.navigable && req.link
        
        return (
          <div 
            key={`${req.type}-${i}`}
            className={cn(
              "flex items-center gap-2 text-sm",
              req.met ? "text-emerald-400" : "text-red-400"
            )}
          >
            <span className="w-4 text-center">
              {req.met ? "✓" : "○"}
            </span>
            {Icon && <Icon weight="bold" className="w-3.5 h-3.5" />}
            <span className={cn(
              isClickable && !req.met && "hover:underline cursor-pointer"
            )}
              onClick={() => isClickable && !req.met && handleNavigate(req.link!)}
            >
              {formatRequirement(req)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

