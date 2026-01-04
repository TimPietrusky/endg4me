"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Queue, 
  UsersThree, 
  Cpu, 
  Lightning, 
  CurrencyDollar,
  Lock,
  CheckCircle 
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { formatCompact } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface AttributesPanelProps {
  userId: Id<"users">
  currentRp: number
  // Current stats for display
  queueSlots: number
  staffCapacity: number
  computeUnits: number
  researchSpeedBonus: number
  moneyMultiplier: number
}

// Attribute type definitions
type AttributeType = "queue_slots" | "staff_capacity" | "compute_units" | "research_speed" | "money_multiplier"

interface AttributeConfig {
  type: AttributeType
  name: string
  shortName: string
  icon: React.ElementType
  color: string
  bgGlow: string
  description: string
  formatValue: (val: number) => string
}

const ATTRIBUTES: AttributeConfig[] = [
  {
    type: "queue_slots",
    name: "Queue Capacity",
    shortName: "QUEUE",
    icon: Queue,
    color: "text-cyan-400",
    bgGlow: "from-cyan-500/30 to-cyan-500/5",
    description: "Parallel task slots",
    formatValue: (v) => `${v}`,
  },
  {
    type: "staff_capacity", 
    name: "Staff Capacity",
    shortName: "STAFF",
    icon: UsersThree,
    color: "text-pink-400",
    bgGlow: "from-pink-500/30 to-pink-500/5",
    description: "Max researchers",
    formatValue: (v) => `${v}`,
  },
  {
    type: "compute_units",
    name: "Compute Units",
    shortName: "CU",
    icon: Cpu,
    color: "text-orange-400", 
    bgGlow: "from-orange-500/30 to-orange-500/5",
    description: "GPU capacity",
    formatValue: (v) => `${v}`,
  },
  {
    type: "research_speed",
    name: "Research Speed",
    shortName: "SPEED",
    icon: Lightning,
    color: "text-purple-400",
    bgGlow: "from-purple-500/30 to-purple-500/5",
    description: "Task completion bonus",
    formatValue: (v) => `+${v}%`,
  },
  {
    type: "money_multiplier",
    name: "Income Boost",
    shortName: "INCOME",
    icon: CurrencyDollar,
    color: "text-green-400",
    bgGlow: "from-green-500/30 to-green-500/5",
    description: "Cash reward multiplier",
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
]

export function AttributesPanel({
  userId,
  currentRp,
  queueSlots,
  staffCapacity,
  computeUnits,
  researchSpeedBonus,
  moneyMultiplier,
}: AttributesPanelProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)

  // Filter to only attribute nodes
  const attributeNodes = researchState?.filter((node) => node.category === "attributes") || []

  // Group nodes by attribute type
  const nodesByAttribute = attributeNodes.reduce((acc, node) => {
    if (node.attributeType) {
      if (!acc[node.attributeType]) {
        acc[node.attributeType] = []
      }
      acc[node.attributeType].push(node)
    }
    return acc
  }, {} as Record<string, typeof attributeNodes>)

  // Get current value for each attribute
  const getCurrentValue = (type: AttributeType): number => {
    switch (type) {
      case "queue_slots": return queueSlots
      case "staff_capacity": return staffCapacity
      case "compute_units": return computeUnits
      case "research_speed": return researchSpeedBonus
      case "money_multiplier": return moneyMultiplier
      default: return 0
    }
  }

  // Get next available upgrade for an attribute
  const getNextUpgrade = (type: AttributeType) => {
    const nodes = nodesByAttribute[type] || []
    // Find the first unpurchased, available node
    const available = nodes.find((n) => n.isAvailable)
    // Or the first unpurchased, locked node (to show what's next)
    const nextLocked = nodes.find((n) => !n.isPurchased && n.isLocked)
    return available || nextLocked
  }

  // Count purchased upgrades for an attribute
  const getPurchasedCount = (type: AttributeType): number => {
    const nodes = nodesByAttribute[type] || []
    return nodes.filter((n) => n.isPurchased).length
  }

  const getTotalCount = (type: AttributeType): number => {
    return (nodesByAttribute[type] || []).length
  }

  const handlePurchase = async (nodeId: string, nodeName: string) => {
    try {
      await purchaseNode({ userId, nodeId })
      toast({
        title: "Attribute Upgraded",
        description: `${nodeName}`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not upgrade attribute"
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight">global attributes</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Spend RP to permanently increase your lab&apos;s core capabilities
        </p>
      </div>

      {/* Hexagonal grid layout - Cyberpunk style */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ATTRIBUTES.map((attr) => {
          const Icon = attr.icon
          const currentVal = getCurrentValue(attr.type)
          const nextUpgrade = getNextUpgrade(attr.type)
          const purchased = getPurchasedCount(attr.type)
          const total = getTotalCount(attr.type)
          const isMaxed = purchased >= total && total > 0

          return (
            <div
              key={attr.type}
              className={cn(
                "relative group",
                "bg-gradient-to-b border rounded-lg overflow-hidden",
                attr.bgGlow,
                "border-white/10 hover:border-white/30 transition-all"
              )}
            >
              {/* Hex pattern background overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              
              <div className="relative p-4">
                {/* Icon and name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-2 rounded-lg bg-black/30", attr.color)}>
                    <Icon className="w-5 h-5" weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wider text-muted-foreground">
                      {attr.shortName}
                    </div>
                    <div className={cn("text-2xl font-black tabular-nums", attr.color)}>
                      {attr.formatValue(currentVal)}
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        i < purchased ? attr.color.replace("text-", "bg-") : "bg-white/10"
                      )}
                    />
                  ))}
                </div>

                {/* Upgrade button or status */}
                {isMaxed ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    <span>MAXED</span>
                  </div>
                ) : nextUpgrade ? (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground">
                      {nextUpgrade.description}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={nextUpgrade.isLocked || currentRp < nextUpgrade.rpCost}
                      onClick={() => handlePurchase(nextUpgrade.nodeId, nextUpgrade.name)}
                      className={cn(
                        "w-full text-xs h-8 border-white/20",
                        "hover:bg-white hover:text-black transition-all"
                      )}
                    >
                      {nextUpgrade.isLocked ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          {nextUpgrade.lockReason}
                        </>
                      ) : (
                        <>
                          <Lightning className="w-3 h-3 mr-1" />
                          {formatCompact(nextUpgrade.rpCost)} RP
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No upgrades available
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 rounded-full bg-white" />
          <span>purchased</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 rounded-full bg-white/10" />
          <span>available</span>
        </div>
      </div>
    </div>
  )
}

