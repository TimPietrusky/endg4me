"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Lightning, 
  Lock, 
  CheckCircle, 
  Brain,
  Wrench,
  Sparkle,
  CaretRight
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { formatCompact, cn } from "@/lib/utils"

interface PerkTreeProps {
  userId: Id<"users">
  currentRp: number
  category: "blueprints" | "capabilities" | "perks"
}

const CATEGORY_CONFIG = {
  blueprints: {
    name: "Model Blueprints",
    description: "Unlock the ability to train new model types and sizes",
    icon: Brain,
    color: "purple",
    nodeGradient: "from-purple-500/20 to-purple-500/5",
    nodeBorder: "border-purple-500/30",
    nodeActive: "border-purple-400 shadow-purple-500/20",
    accentColor: "text-purple-400",
    bgAccent: "bg-purple-500",
  },
  capabilities: {
    name: "Capabilities",
    description: "Unlock new job types, features, and world actions",
    icon: Wrench,
    color: "cyan",
    nodeGradient: "from-cyan-500/20 to-cyan-500/5",
    nodeBorder: "border-cyan-500/30",
    nodeActive: "border-cyan-400 shadow-cyan-500/20",
    accentColor: "text-cyan-400",
    bgAccent: "bg-cyan-500",
  },
  perks: {
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
}

export function PerkTree({ userId, currentRp, category }: PerkTreeProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)

  const config = CATEGORY_CONFIG[category]
  const Icon = config.icon

  // Filter nodes by category
  const nodes = researchState?.filter((node) => node.category === category) || []

  // Build dependency graph for visualization
  // Group nodes into tiers based on prerequisites
  const nodeMap = new Map(nodes.map(n => [n.nodeId, n]))
  
  const getTier = (nodeId: string, visited = new Set<string>()): number => {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)
    const node = nodeMap.get(nodeId)
    if (!node || node.prerequisiteNodes.length === 0) return 0
    return Math.max(...node.prerequisiteNodes.map(p => getTier(p, visited))) + 1
  }

  // Group nodes by tier
  const nodesByTier: Record<number, typeof nodes> = {}
  nodes.forEach(node => {
    const tier = getTier(node.nodeId)
    if (!nodesByTier[tier]) nodesByTier[tier] = []
    nodesByTier[tier].push(node)
  })

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

  if (nodes.length === 0) {
    return (
      <div className="mt-4">
        <div className="text-center py-16 text-muted-foreground">
          <Icon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">{config.name}</p>
          <p className="text-sm">No research nodes available yet.</p>
          <p className="text-xs mt-2">Research nodes will be added in future updates.</p>
        </div>
      </div>
    )
  }

  const tiers = Object.keys(nodesByTier).map(Number).sort((a, b) => a - b)

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", config.nodeGradient, config.nodeBorder, "border")}>
          <Icon className={cn("w-5 h-5", config.accentColor)} weight="bold" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{config.name.toLowerCase()}</h2>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Skill Tree visualization */}
      <div className="relative">
        {/* Tier rows */}
        <div className="space-y-8">
          {tiers.map((tier, tierIndex) => (
            <div key={tier} className="relative">
              {/* Tier label */}
              {tier === 0 && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase tracking-wider -rotate-90 origin-center">
                  base
                </div>
              )}
              
              {/* Connection lines to previous tier */}
              {tierIndex > 0 && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <CaretRight className="w-4 h-4 text-white/20 rotate-90" />
                </div>
              )}

              {/* Nodes in this tier */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {nodesByTier[tier].map((node) => {
                  const canAfford = currentRp >= node.rpCost
                  const isReady = node.isAvailable && canAfford

                  return (
                    <div
                      key={node.nodeId}
                      className={cn(
                        "relative w-full md:w-72",
                        "bg-gradient-to-br rounded-lg border p-4",
                        config.nodeGradient,
                        node.isPurchased 
                          ? "border-white/40 opacity-70" 
                          : node.isAvailable 
                            ? cn(config.nodeActive, "shadow-lg")
                            : cn(config.nodeBorder, "opacity-60")
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

                        {/* Unlock description */}
                        <div className={cn(
                          "text-xs mb-3 flex items-start gap-1.5",
                          node.isPurchased ? "text-green-400" : config.accentColor
                        )}>
                          <CaretRight className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{node.unlockDescription}</span>
                        </div>

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

                      {/* Prerequisites connection indicator */}
                      {node.prerequisiteNodes.length > 0 && !node.isPurchased && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            node.isAvailable ? config.bgAccent : "bg-white/20"
                          )} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-6 text-xs text-muted-foreground">
        <div>
          <span className="text-white font-bold">{nodes.filter(n => n.isPurchased).length}</span>
          <span className="ml-1">researched</span>
        </div>
        <div>
          <span className="text-white font-bold">{nodes.filter(n => n.isAvailable).length}</span>
          <span className="ml-1">available</span>
        </div>
        <div>
          <span className="text-white font-bold">{nodes.filter(n => n.isLocked).length}</span>
          <span className="ml-1">locked</span>
        </div>
      </div>
    </div>
  )
}

