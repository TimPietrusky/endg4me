"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Lightning, Lock, CheckCircle, ArrowRight, Brain, Wrench, Sparkle } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { formatCompact } from "@/lib/utils"

interface ResearchViewProps {
  userId: Id<"users">
  currentRp: number
}

export function ResearchView({ userId, currentRp }: ResearchViewProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)

  const handlePurchase = async (nodeId: string, nodeName: string) => {
    try {
      await purchaseNode({ userId, nodeId })
      toast({
        title: "Research Complete",
        description: `Unlocked: ${nodeName}`,
      })
    } catch (error: any) {
      toast({
        title: "Research Failed",
        description: error.message || "Could not complete research",
        variant: "destructive",
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "blueprints":
        return <Brain className="w-5 h-5" />
      case "capabilities":
        return <Wrench className="w-5 h-5" />
      case "perks":
        return <Sparkle className="w-5 h-5" />
      default:
        return <Lightning className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "blueprints":
        return "from-purple-500/20 to-purple-500/5 border-purple-500/30"
      case "capabilities":
        return "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30"
      case "perks":
        return "from-amber-500/20 to-amber-500/5 border-amber-500/30"
      default:
        return "from-gray-500/20 to-gray-500/5 border-gray-500/30"
    }
  }

  // Group nodes by category
  const nodesByCategory = researchState?.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = []
    }
    acc[node.category].push(node)
    return acc
  }, {} as Record<string, typeof researchState>)

  if (!researchState || researchState.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Lightning className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Research Tree</h2>
              <p className="text-sm text-muted-foreground">Spend RP on permanent unlocks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <Lightning className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">{formatCompact(currentRp)}</span>
            <span className="text-sm text-muted-foreground">RP available</span>
          </div>
        </div>

        <div className="text-center py-16 text-muted-foreground">
          <Lightning className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Research Tree</p>
          <p className="text-sm">No research nodes available yet.</p>
          <p className="text-xs mt-2">Research nodes will be added in future updates.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Lightning className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Research Tree</h2>
            <p className="text-sm text-muted-foreground">Spend RP on permanent unlocks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <Lightning className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg">{formatCompact(currentRp)}</span>
          <span className="text-sm text-muted-foreground">RP available</span>
        </div>
      </div>

      {/* Research Categories */}
      {nodesByCategory && Object.entries(nodesByCategory).map(([category, nodes]) => (
        <div key={category}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 capitalize">
            {getCategoryIcon(category)}
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes?.map((node) => (
              <Card
                key={node.nodeId}
                className={`bg-gradient-to-br ${getCategoryColor(node.category)} ${
                  node.isPurchased ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{node.name}</CardTitle>
                    {node.isPurchased && (
                      <CheckCircle className="w-5 h-5 text-green-400" weight="fill" />
                    )}
                    {node.isLocked && (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{node.description}</p>
                  
                  {/* Requirements */}
                  {node.minLevel > 1 && (
                    <Badge variant="outline" className="text-xs mb-2 mr-1">
                      Lvl {node.minLevel}+
                    </Badge>
                  )}
                  {node.prerequisiteNodes.length > 0 && (
                    <Badge variant="outline" className="text-xs mb-2">
                      Requires: {node.prerequisiteNodes.join(", ")}
                    </Badge>
                  )}

                  {/* Unlock info */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <ArrowRight className="w-3 h-3" />
                    {node.unlockDescription}
                  </div>

                  {/* Cost & Action */}
                  {!node.isPurchased && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Lightning className="w-4 h-4 text-primary" />
                        <span className="font-bold">{formatCompact(node.rpCost)}</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={node.isLocked || currentRp < node.rpCost}
                        onClick={() => handlePurchase(node.nodeId, node.name)}
                        className="text-xs h-7"
                      >
                        {node.isLocked ? node.lockReason : "Research"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

