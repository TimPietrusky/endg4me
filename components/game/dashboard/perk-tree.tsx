"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Lock, 
  CheckCircle, 
  Brain,
  Sparkle,
  CurrencyDollar,
  Users,
  Spinner
} from "@phosphor-icons/react"
import { SubSubNav, SubSubNavFilter } from "./sub-nav"
import { SpendButton } from "./spend-button"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

type StatusFilter = "available" | "locked" | "researched" | "researching"

interface PerkTreeProps {
  userId: Id<"users">
  currentRp: number
  category: "model" | "revenue" | "perk" | "hiring"
}

const CATEGORY_CONFIG = {
  model: {
    name: "Models",
    description: "Unlock the ability to train new model types and sizes",
    icon: Brain,
    color: "purple",
    nodeGradient: "from-purple-500/20 to-purple-500/5",
    nodeBorder: "border-purple-500/30",
    nodeActive: "border-purple-400 shadow-purple-500/20",
    accentColor: "text-purple-400",
    bgAccent: "bg-purple-500",
  },
  revenue: {
    name: "Revenue",
    description: "Ways to earn money through contracts and freelance work",
    icon: CurrencyDollar,
    color: "green",
    nodeGradient: "from-green-500/20 to-green-500/5",
    nodeBorder: "border-green-500/30",
    nodeActive: "border-green-400 shadow-green-500/20",
    accentColor: "text-green-400",
    bgAccent: "bg-green-500",
  },
  perk: {
    name: "Perks",
    description: "Passive bonuses that improve your lab's efficiency",
    icon: Sparkle,
    color: "amber",
    nodeGradient: "from-amber-500/20 to-amber-500/5",
    nodeBorder: "border-amber-500/30",
    nodeActive: "border-amber-400 shadow-amber-500/20",
    accentColor: "text-amber-400",
    bgAccent: "bg-amber-500",
  },
  hiring: {
    name: "Hiring",
    description: "Unlock temporary hires for boosts",
    icon: Users,
    color: "blue",
    nodeGradient: "from-blue-500/20 to-blue-500/5",
    nodeBorder: "border-blue-500/30",
    nodeActive: "border-blue-400 shadow-blue-500/20",
    accentColor: "text-blue-400",
    bgAccent: "bg-blue-500",
  },
}

export function PerkTree({ userId, currentRp, category }: PerkTreeProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)
  const [activeFilters, setActiveFilters] = useState<Set<StatusFilter>>(new Set())

  const config = CATEGORY_CONFIG[category]

  // Filter nodes by category
  const nodes = researchState?.nodes?.filter((node) => node.category === category) || []
  const effectiveNow = researchState?.effectiveNow || Date.now()

  const handlePurchase = async (nodeId: string, nodeName: string) => {
    try {
      await purchaseNode({ userId, nodeId })
      toast({
        title: "Research Started",
        description: `Researching: ${nodeName}`,
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

  // Render a single node card
  const renderNode = (node: typeof nodes[0]) => {
    const canAfford = currentRp >= node.rpCost
    const isDisabled = node.isLocked || (!canAfford && !node.isResearching)
    const disabledReason = node.isLocked 
      ? node.lockReason?.replace("Requires ", "") || "locked"
      : !canAfford && !node.isResearching
        ? "not enough RP" 
        : undefined
    const rpShortfall = !canAfford && !node.isLocked && !node.isResearching ? node.rpCost - currentRp : 0
    const isAvailable = !node.isPurchased && !node.isLocked && !node.isResearching

    // Calculate remaining time for research in progress
    const remainingTime = node.isResearching && node.completesAt 
      ? Math.max(0, node.completesAt - effectiveNow)
      : undefined

    return (
      <div
        key={node.nodeId}
        className={cn(
          "relative w-full md:w-72 overflow-hidden",
          "rounded-lg border flex flex-col",
          node.isPurchased 
            ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50"
            : node.isResearching
              ? cn("bg-gradient-to-br", config.nodeGradient, "border", config.nodeActive, "shadow-lg")
              : isAvailable
                ? cn("bg-gradient-to-br", config.nodeGradient, "border", config.nodeBorder)
                : "bg-black/20 border border-white/10 opacity-60"
        )}
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-10">
          {node.isPurchased ? (
            <CheckCircle className="w-5 h-5 text-green-400" weight="fill" />
          ) : node.isResearching ? (
            <Spinner className="w-5 h-5 text-amber-400 animate-spin" />
          ) : node.isLocked ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : null}
        </div>

        {/* Node content */}
        <div className="pr-6 p-4 flex-1">
          <h3 className="font-bold text-sm mb-1">{node.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {node.description}
          </p>

          {/* Requirements badges */}
          {(node.minLevel > 1 || node.prerequisiteNodes.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {node.minLevel > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                  LVL {node.minLevel}+
                </span>
              )}
              {node.prerequisiteNodes.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                  {node.prerequisiteNodes.length} prereq
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {node.isPurchased ? (
          <div className="w-full bg-emerald-500/20 border-t border-emerald-500/30">
            <div className="flex items-center justify-center h-[52px]">
              <span className="text-lg font-bold text-emerald-400 lowercase flex items-center gap-2">
                <CheckCircle weight="fill" className="w-5 h-5" />
                unlocked
              </span>
            </div>
          </div>
        ) : (
          <SpendButton
            label="research"
            disabled={isDisabled}
            disabledReason={disabledReason}
            onAction={() => handlePurchase(node.nodeId, node.name)}
            showConfirmation={true}
            shortfalls={rpShortfall > 0 ? [{ type: "rp", amount: rpShortfall }] : []}
            attributes={[
              { type: "time", value: node.durationMs / 1000 },
              { type: "rp", value: node.rpCost, isGain: false },
            ]}
            attributeLayout="compact"
            // Active state for research in progress (duration/remaining in seconds)
            isActive={node.isResearching}
            duration={node.durationMs / 1000}
            remainingTime={remainingTime !== undefined ? remainingTime / 1000 : undefined}
          />
        )}
      </div>
    )
  }

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

      {/* Sections by status */}
      <div className="space-y-8">
        {/* RESEARCHING section (show first - most important) */}
        {researchingNodes.length > 0 && shouldShowStatus("researching") && (
          <div>
            <h3 className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-4">RESEARCHING</h3>
            <div className="flex flex-wrap gap-4">
              {researchingNodes.map(renderNode)}
            </div>
          </div>
        )}

        {/* AVAILABLE section */}
        {availableNodes.filter(n => !n.isResearching).length > 0 && shouldShowStatus("available") && (
          <div>
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">AVAILABLE</h3>
            <div className="flex flex-wrap gap-4">
              {availableNodes.filter(n => !n.isResearching).map(renderNode)}
            </div>
          </div>
        )}

        {/* LOCKED section */}
        {lockedNodes.length > 0 && shouldShowStatus("locked") && (
          <div>
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">LOCKED</h3>
            <div className="flex flex-wrap gap-4">
              {lockedNodes.map(renderNode)}
            </div>
          </div>
        )}

        {/* RESEARCHED section */}
        {researchedNodes.length > 0 && shouldShowStatus("researched") && (
          <div>
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">RESEARCHED</h3>
            <div className="flex flex-wrap gap-4">
              {researchedNodes.map(renderNode)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

