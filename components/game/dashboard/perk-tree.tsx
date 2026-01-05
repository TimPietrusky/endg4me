"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Lightning, 
  Lock, 
  CheckCircle, 
  Brain,
  Wrench,
  Sparkle,
  CurrencyDollar,
  Users
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { SubSubNav, SubSubNavFilter } from "./sub-nav"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { formatCompact, cn } from "@/lib/utils"

type StatusFilter = "available" | "locked" | "researched"

interface PerkTreeProps {
  userId: Id<"users">
  currentRp: number
  category: "model" | "monetization" | "perk" | "income" | "hiring"
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
  monetization: {
    name: "Monetization",
    description: "Ways to make money with your trained models",
    icon: Wrench,
    color: "cyan",
    nodeGradient: "from-cyan-500/20 to-cyan-500/5",
    nodeBorder: "border-cyan-500/30",
    nodeActive: "border-cyan-400 shadow-cyan-500/20",
    accentColor: "text-cyan-400",
    bgAccent: "bg-cyan-500",
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
  income: {
    name: "Income",
    description: "Freelance work to earn money without models",
    icon: CurrencyDollar,
    color: "green",
    nodeGradient: "from-green-500/20 to-green-500/5",
    nodeBorder: "border-green-500/30",
    nodeActive: "border-green-400 shadow-green-500/20",
    accentColor: "text-green-400",
    bgAccent: "bg-green-500",
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
  const nodes = researchState?.filter((node) => node.category === category) || []

  const handlePurchase = async (nodeId: string, nodeName: string) => {
    try {
      await purchaseNode({ userId, nodeId })
      toast({
        title: "Research Complete",
        description: `Unlocked: ${nodeName}`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not complete research"
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

  // Group nodes by status: available, locked, researched
  const availableNodes = nodes.filter(n => !n.isPurchased && !n.isLocked)
  const lockedNodes = nodes.filter(n => n.isLocked)
  const researchedNodes = nodes.filter(n => n.isPurchased)

  // Stats for sub-sub-nav
  const purchasedCount = researchedNodes.length
  const availableCount = availableNodes.length
  const lockedCount = lockedNodes.length

  // Render a single node card
  const renderNode = (node: typeof nodes[0]) => {
    const canAfford = currentRp >= node.rpCost
    const isReady = !node.isPurchased && !node.isLocked && canAfford

    return (
      <div
        key={node.nodeId}
        className={cn(
          "relative w-full md:w-72",
          "rounded-lg border p-4",
          node.isPurchased 
            ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50"
            : cn("border", config.nodeBorder)
        )}
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          {node.isPurchased ? (
            <CheckCircle className="w-5 h-5 text-green-400" weight="fill" />
          ) : node.isLocked ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : null}
        </div>

        {/* Node content */}
        <div className="pr-6">
          <h3 className="font-bold text-sm mb-1">{node.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {node.description}
          </p>

          {/* Requirements badges */}
          {(node.minLevel > 1 || node.prerequisiteNodes.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-3">
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

          {/* Action */}
          {!node.isPurchased && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Lightning className={cn("w-4 h-4", config.accentColor)} />
                <span className={cn("font-bold text-sm", !canAfford && "text-red-400")}>
                  {formatCompact(node.rpCost)}
                </span>
              </div>
              <Button
                size="sm"
                variant={isReady ? "default" : "outline"}
                disabled={!isReady}
                onClick={() => handlePurchase(node.nodeId, node.name)}
                className={cn(
                  "text-xs h-7",
                  isReady && "bg-white text-black hover:bg-white/90"
                )}
              >
                {node.isLocked 
                  ? node.lockReason?.replace("Requires ", "") || "Locked"
                  : !canAfford 
                    ? "Need RP" 
                    : "Research"
                }
              </Button>
            </div>
          )}
        </div>
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
        {/* AVAILABLE section */}
        {availableNodes.length > 0 && shouldShowStatus("available") && (
          <div>
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">AVAILABLE</h3>
            <div className="flex flex-wrap gap-4">
              {availableNodes.map(renderNode)}
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

