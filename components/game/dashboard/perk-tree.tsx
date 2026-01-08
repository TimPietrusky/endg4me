"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Brain,
  CurrencyDollar,
  Users,
} from "@phosphor-icons/react"
import { SubSubNav, SubSubNavFilter } from "./sub-nav"
import { ActionCard } from "./action-card"
import { ACTION_GRID_CLASSES } from "./grid-classes"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import type { Action, ActionRequirement } from "@/lib/game-types"
import { getContentById, getContentImageUrl } from "@/convex/lib/contentCatalog"

type StatusFilter = "available" | "locked" | "researched" | "researching"

interface PerkTreeProps {
  userId: Id<"users">
  currentRp: number
  playerLevel: number
  category: "model" | "revenue" | "hiring"
}

// Map category to Action category for ActionCard styling
const CATEGORY_TO_ACTION_CATEGORY: Record<string, string> = {
  model: "RESEARCH_MODEL",
  revenue: "RESEARCH_REVENUE",
  hiring: "RESEARCH_HIRING",
}

const CATEGORY_CONFIG = {
  model: {
    name: "Models",
    description: "Unlock the ability to train new model types and sizes",
    icon: Brain,
  },
  revenue: {
    name: "Revenue",
    description: "Ways to earn money through contracts and freelance work",
    icon: CurrencyDollar,
  },
  hiring: {
    name: "Hiring",
    description: "Unlock temporary hires for boosts",
    icon: Users,
  },
}

export function PerkTree({ userId, currentRp, playerLevel, category }: PerkTreeProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)
  const [activeFilters, setActiveFilters] = useState<Set<StatusFilter>>(new Set())

  const config = CATEGORY_CONFIG[category]
  const actionCategory = CATEGORY_TO_ACTION_CATEGORY[category]

  // Filter nodes by category
  const nodes = researchState?.nodes?.filter((node) => node.category === category) || []
  const effectiveNow = researchState?.effectiveNow || Date.now()

  const handleStartAction = async (action: Action) => {
    try {
      await purchaseNode({ userId, nodeId: action.id })
      toast({
        title: "Research Started",
        description: `Researching: ${action.name}`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not start research"
      toast({
        title: "Research Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const toggleFilter = (filter: StatusFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
  }

  // Check if a status should be shown based on active filters
  const shouldShowStatus = (status: StatusFilter) => {
    if (activeFilters.size === 0) return true
    return activeFilters.has(status)
  }

  // Convert a node to an Action for ActionCard
  const nodeToAction = (node: typeof nodes[0]): Action => {
    const canAfford = currentRp >= node.rpCost
    const meetsLevel = playerLevel >= node.minLevel
    const isDisabled = node.isLocked || (!canAfford && !node.isResearching)
    
    // Only show level requirement as disabled reason (not prereqs)
    const levelShortfall = !meetsLevel ? node.minLevel - playerLevel : undefined
    const disabledReason = !meetsLevel
      ? `LVL ${node.minLevel}+`
      : !canAfford && !node.isResearching
        ? "not enough RP" 
        : undefined
    const rpShortfall = !canAfford && !node.isLocked && !node.isResearching ? node.rpCost - currentRp : 0
    
    // Calculate remaining time for research in progress
    const remainingTime = node.isResearching && node.completesAt 
      ? Math.max(0, (node.completesAt - effectiveNow) / 1000)
      : undefined

    // Get image from content catalog if available
    const content = getContentById(node.nodeId)
    const image = content ? getContentImageUrl(content) : undefined
    
    // Get prerequisite info
    const prerequisiteId = node.prerequisiteNodes.length > 0 ? node.prerequisiteNodes[0] : undefined
    const prerequisiteContent = prerequisiteId ? getContentById(prerequisiteId) : undefined
    const prerequisiteName = prerequisiteContent?.name
    
    // Extract size from name (e.g., "3B TTS" -> "3B")
    const sizeMatch = node.name.match(/^(\d+B)/)
    const size = sizeMatch ? sizeMatch[1] : undefined

    // Build unified requirements array
    // Order: research (prereqs) -> level -> rp
    const requirements: ActionRequirement[] = []
    
    // Prerequisite research requirement
    if (prerequisiteId && prerequisiteName) {
      // Check if prereq is purchased by looking at nodes
      const prereqNode = researchState?.nodes?.find(n => n.nodeId === prerequisiteId)
      const prereqMet = prereqNode?.isPurchased ?? false
      requirements.push({
        type: 'research',
        label: prerequisiteName,
        met: prereqMet,
        navigable: !prereqMet,
        link: !prereqMet ? { view: 'research', target: prerequisiteId } : undefined,
      })
    }
    
    // Level requirement
    if (node.minLevel > 1) {
      requirements.push({
        type: 'level',
        label: String(node.minLevel),
        value: node.minLevel,
        met: meetsLevel,
        navigable: !meetsLevel,
        link: !meetsLevel ? { view: 'lab/levels' as const } : undefined,
      })
    }

    return {
      id: node.nodeId,
      category: actionCategory,
      name: size ? node.name.replace(/^\d+B\s*/, "") : node.name, // Remove size prefix if present
      description: node.description,
      cost: 0,
      duration: node.durationMs / 1000,
      rpCost: node.rpCost,
      rpShortfall: rpShortfall > 0 ? rpShortfall : undefined,
      disabled: isDisabled,
      disabledReason,
      locked: node.isLocked,
      lockReason: node.lockReason,
      isActive: node.isResearching,
      remainingTime,
      completed: node.isPurchased,
      minLevel: node.minLevel,
      prerequisiteCount: node.prerequisiteNodes.length,
      prerequisiteId,
      prerequisiteName,
      levelShortfall,
      image,
      size,
      // Unified requirements
      requirements,
    }
  }

  if (nodes.length === 0) {
    const Icon = config.icon
    return (
      <div className="mt-2">
      <SubSubNav>
        <SubSubNavFilter label="available" count={0} />
        <SubSubNavFilter label="locked" count={0} />
        <SubSubNavFilter label="researched" count={0} />
      </SubSubNav>
        <div className="text-center py-16 text-muted-foreground">
          <Icon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">{config.name}</p>
          <p className="text-sm">No research nodes available yet.</p>
        </div>
      </div>
    )
  }

  // Group nodes by status: available (includes researching), locked, researched
  const availableNodes = nodes.filter(n => !n.isPurchased && !n.isLocked)
  const researchingNodes = nodes.filter(n => n.isResearching)
  const lockedNodes = nodes.filter(n => n.isLocked)
  const researchedNodes = nodes.filter(n => n.isPurchased)

  // Stats for sub-sub-nav
  const purchasedCount = researchedNodes.length
  const availableCount = availableNodes.length
  const researchingCount = researchingNodes.length
  const lockedCount = lockedNodes.length

  return (
    <div className="mt-2">
      {/* Sub-sub-nav with clickable filters */}
      <SubSubNav>
        <SubSubNavFilter 
          label="available" 
          count={availableCount} 
          isActive={activeFilters.has("available")}
          onClick={() => toggleFilter("available")}
        />
        {researchingCount > 0 && (
          <SubSubNavFilter 
            label="researching" 
            count={researchingCount}
            isActive={activeFilters.has("researching")}
            onClick={() => toggleFilter("researching")}
          />
        )}
        <SubSubNavFilter 
          label="locked" 
          count={lockedCount}
          isActive={activeFilters.has("locked")}
          onClick={() => toggleFilter("locked")}
        />
        <SubSubNavFilter 
          label="researched" 
          count={purchasedCount}
          isActive={activeFilters.has("researched")}
          onClick={() => toggleFilter("researched")}
        />
      </SubSubNav>

      {/* Sections by status - using same grid layout as TasksView */}
      <div className="space-y-8">
        {/* RESEARCHING section (show first - most important) */}
        {researchingNodes.length > 0 && shouldShowStatus("researching") && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-amber-400">RESEARCHING</h2>
            <div className={ACTION_GRID_CLASSES}>
              {researchingNodes.map(node => (
                <ActionCard 
                  key={node.nodeId} 
                  action={nodeToAction(node)} 
                  onStartAction={handleStartAction} 
                />
              ))}
            </div>
          </div>
        )}

        {/* AVAILABLE section */}
        {availableNodes.filter(n => !n.isResearching).length > 0 && shouldShowStatus("available") && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">AVAILABLE</h2>
            <div className={ACTION_GRID_CLASSES}>
              {availableNodes.filter(n => !n.isResearching).map(node => (
                <ActionCard 
                  key={node.nodeId} 
                  action={nodeToAction(node)} 
                  onStartAction={handleStartAction} 
                />
              ))}
            </div>
          </div>
        )}

        {/* LOCKED section */}
        {lockedNodes.length > 0 && shouldShowStatus("locked") && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-muted-foreground">LOCKED</h2>
            <div className={ACTION_GRID_CLASSES}>
              {lockedNodes.map(node => (
                <ActionCard 
                  key={node.nodeId} 
                  action={nodeToAction(node)} 
                  onStartAction={handleStartAction} 
                />
              ))}
            </div>
          </div>
        )}

        {/* RESEARCHED section */}
        {researchedNodes.length > 0 && shouldShowStatus("researched") && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4 text-primary">RESEARCHED</h2>
            <div className={ACTION_GRID_CLASSES}>
              {researchedNodes.map(node => (
                <ActionCard 
                  key={node.nodeId} 
                  action={nodeToAction(node)} 
                  onStartAction={handleStartAction} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

