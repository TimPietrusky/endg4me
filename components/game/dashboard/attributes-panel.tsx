"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  Lightning, 
  Lock, 
  CaretDown,
  Queue,
  UsersThree,
  Cpu,
  Timer,
  CurrencyDollar
} from "@phosphor-icons/react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { formatCompact, cn } from "@/lib/utils"
import { FOUNDER_MODIFIERS } from "@/convex/lib/gameConstants"

interface AttributesPanelProps {
  userId: Id<"users">
  currentRp: number
  queueSlots: number
  staffCapacity: number
  computeUnits: number
  researchSpeedBonus: number
  moneyMultiplier: number
  founderType: "technical" | "business"
  juniorResearchers: number
  playerLevel: number
}

type AttributeType = "queue_slots" | "staff_capacity" | "compute_units" | "research_speed" | "money_multiplier"

interface BonusSource {
  name: string
  value: number
  isMultiplier?: boolean
}

interface AttributeConfig {
  type: AttributeType
  name: string
  icon: React.ElementType
  formatValue: (val: number) => string
  formatBonus?: (val: number) => string
}

const ATTRIBUTES: AttributeConfig[] = [
  {
    type: "queue_slots",
    name: "queue",
    icon: Queue,
    formatValue: (v) => `${v}`,
  },
  {
    type: "staff_capacity", 
    name: "staff",
    icon: UsersThree,
    formatValue: (v) => `${v}`,
  },
  {
    type: "compute_units",
    name: "compute",
    icon: Cpu,
    formatValue: (v) => `${v}`,
  },
  {
    type: "research_speed",
    name: "research speed",
    icon: Timer,
    formatValue: (v) => v === 0 ? "0%" : `+${v}%`,
    formatBonus: (v) => `+${Math.round((v - 1) * 100)}%`,
  },
  {
    type: "money_multiplier",
    name: "income",
    icon: CurrencyDollar,
    formatValue: (v) => `${v.toFixed(1)}x`,
    formatBonus: (v) => `${v > 1 ? "+" : ""}${Math.round((v - 1) * 100)}%`,
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
  founderType,
  juniorResearchers,
  playerLevel,
}: AttributesPanelProps) {
  const { toast } = useToast()
  const researchState = useQuery(api.research.getResearchTreeState, { userId })
  const purchaseNode = useMutation(api.research.purchaseResearchNode)

  const attributeNodes = researchState?.filter((node) => node.category === "attributes") || []

  const nodesByAttribute = attributeNodes.reduce((acc, node) => {
    if (node.attributeType) {
      if (!acc[node.attributeType]) {
        acc[node.attributeType] = []
      }
      acc[node.attributeType].push(node)
    }
    return acc
  }, {} as Record<string, typeof attributeNodes>)

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

  // Get bonus sources for each attribute type
  const getBonusSources = (type: AttributeType): BonusSource[] => {
    const sources: BonusSource[] = []
    const founderMods = FOUNDER_MODIFIERS[founderType]

    if (type === "research_speed") {
      // Founder bonus for research speed
      if (founderMods.researchSpeed !== 1.0) {
        sources.push({
          name: `${founderType} founder`,
          value: founderMods.researchSpeed,
          isMultiplier: true,
        })
      }
      // Staff bonus - +10% per junior researcher
      if (juniorResearchers > 0) {
        sources.push({
          name: `${juniorResearchers} staff`,
          value: 1 + juniorResearchers * 0.1,
          isMultiplier: true,
        })
      }
      // Level bonus - 1% per level
      if (playerLevel > 1) {
        const levelBonus = 1 + (playerLevel - 1) * 0.01
        sources.push({
          name: `level ${playerLevel}`,
          value: levelBonus,
          isMultiplier: true,
        })
      }
    }

    if (type === "money_multiplier") {
      // Founder bonus for money
      if (founderMods.moneyRewards !== 1.0) {
        sources.push({
          name: `${founderType} founder`,
          value: founderMods.moneyRewards,
          isMultiplier: true,
        })
      }
    }

    return sources
  }

  // Calculate total bonus multiplier from external sources
  const getTotalBonus = (type: AttributeType): number => {
    const sources = getBonusSources(type)
    if (sources.length === 0) return 1
    return sources.reduce((acc, s) => acc * s.value, 1)
  }

  const getNextUpgrade = (type: AttributeType) => {
    const nodes = nodesByAttribute[type] || []
    const available = nodes.find((n) => n.isAvailable)
    const nextLocked = nodes.find((n) => !n.isPurchased && n.isLocked)
    return available || nextLocked
  }

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
        title: "Upgraded",
        description: nodeName,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not upgrade"
      toast({
        title: "Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mt-6">
      {/* Single row of cards - fill horizontal, massive height */}
      <div className="flex gap-4">
        {ATTRIBUTES.map((attr) => (
          <AttributeCard
            key={attr.type}
            attr={attr}
            currentValue={getCurrentValue(attr.type)}
            bonusSources={getBonusSources(attr.type)}
            totalBonus={getTotalBonus(attr.type)}
            nextUpgrade={getNextUpgrade(attr.type)}
            purchasedCount={getPurchasedCount(attr.type)}
            totalCount={getTotalCount(attr.type)}
            currentRp={currentRp}
            onPurchase={handlePurchase}
          />
        ))}
      </div>
    </div>
  )
}

interface AttributeCardProps {
  attr: AttributeConfig
  currentValue: number
  bonusSources: BonusSource[]
  totalBonus: number
  nextUpgrade: ReturnType<typeof Array.prototype.find>
  purchasedCount: number
  totalCount: number
  currentRp: number
  onPurchase: (nodeId: string, name: string) => void
}

function AttributeCard({
  attr,
  currentValue,
  bonusSources,
  totalBonus,
  nextUpgrade,
  purchasedCount,
  totalCount,
  currentRp,
  onPurchase,
}: AttributeCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const canAfford = nextUpgrade && currentRp >= nextUpgrade.rpCost
  const isAvailable = nextUpgrade && nextUpgrade.isAvailable
  const isMaxed = purchasedCount >= totalCount && totalCount > 0
  const Icon = attr.icon

  const handleConfirm = () => {
    if (nextUpgrade) {
      onPurchase(nextUpgrade.nodeId, nextUpgrade.name)
      setShowConfirm(false)
    }
  }

  // Format bonus as percentage
  const formatBonusPercent = (value: number): string => {
    const percent = Math.round((value - 1) * 100)
    return percent >= 0 ? `+${percent}%` : `${percent}%`
  }

  const hasBonuses = bonusSources.length > 0 && totalBonus !== 1

  return (
    <div className="flex-1 min-h-[50vh] border border-white/20 bg-black/40 overflow-hidden flex flex-col">
      {/* Header - massive centered content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Title - white, large, lowercase */}
        <div className="text-2xl font-bold text-white lowercase mb-8">
          {attr.name}
        </div>
        
        {/* Icon + value stacked, massive */}
        <Icon className="w-20 h-20 text-white mb-4" weight="regular" />
        <span className="text-7xl font-black text-white tabular-nums">
          {attr.formatValue(currentValue)}
        </span>
        
        {/* Bonus display - green for positive, red for negative */}
        {hasBonuses && (
          <div 
            className="relative mt-4"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className={cn(
              "text-2xl font-bold cursor-help",
              totalBonus >= 1 ? "text-emerald-400" : "text-red-400"
            )}>
              {formatBonusPercent(totalBonus)} bonus
            </span>
            
            {/* Tooltip with breakdown */}
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
                <div className="bg-black/95 border border-white/20 rounded-lg px-4 py-3 min-w-[200px] shadow-xl">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    bonus sources
                  </div>
                  <div className="space-y-1">
                    {bonusSources.map((source, i) => (
                      <div key={i} className="flex justify-between items-center gap-4">
                        <span className="text-sm text-white/80 lowercase">{source.name}</span>
                        <span className={cn(
                          "text-sm font-bold",
                          source.value >= 1 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatBonusPercent(source.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-center">
                    <span className="text-sm text-white/80">total</span>
                    <span className={cn(
                      "text-sm font-black",
                      totalBonus >= 1 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {formatBonusPercent(totalBonus)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Progress squares - grey, larger */}
        {totalCount > 0 && (
          <div className="flex gap-2 mt-8">
            {Array.from({ length: Math.min(totalCount, 8) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-sm",
                  i < purchasedCount ? "bg-white/40" : "bg-white/10"
                )}
              />
            ))}
            {totalCount > 8 && (
              <span className="text-sm text-muted-foreground ml-2">
                +{totalCount - 8}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action area - fixed at bottom */}
      <div className="bg-black/20 border-t border-white/10">
        {isMaxed ? (
          <div className="h-24 flex items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground lowercase">maxed</span>
          </div>
        ) : !nextUpgrade ? (
          <div className="h-24 flex items-center justify-center">
            <span className="text-lg text-muted-foreground">-</span>
          </div>
        ) : showConfirm ? (
          // Confirmation state
          <div className="h-24 flex items-center justify-center gap-6">
            <span className="text-xl font-bold text-muted-foreground">sure?</span>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 text-lg font-black text-black bg-emerald-500 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              yes
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-6 py-2 text-lg font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              no
            </button>
          </div>
        ) : !isAvailable ? (
          // Locked state
          <div className="h-24 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-6 h-6" />
              <span className="text-lg font-bold lowercase">lvl {nextUpgrade.minLevel}</span>
            </div>
            {/* Cost row */}
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Lightning weight="regular" className="w-5 h-5" />
              <CaretDown weight="fill" className="w-4 h-4 text-red-500" />
              <span className="text-base">{formatCompact(nextUpgrade.rpCost)}</span>
            </div>
          </div>
        ) : !canAfford ? (
          // Can't afford state
          <div className="h-24 flex flex-col items-center justify-center gap-2">
            <span className="text-lg font-bold text-muted-foreground lowercase">need more</span>
            {/* Cost row */}
            <div className="flex items-center gap-2">
              <Lightning weight="regular" className="w-5 h-5 text-white" />
              <CaretDown weight="fill" className="w-4 h-4 text-red-500" />
              <span className="text-base text-white">{formatCompact(nextUpgrade.rpCost)}</span>
            </div>
          </div>
        ) : (
          // Available - big upgrade button
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full h-24 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <span className="text-3xl font-black text-white lowercase group-hover:scale-105 transition-transform">
              upgrade
            </span>
            {/* Cost row */}
            <div className="flex items-center gap-2 mt-1">
              <Lightning weight="regular" className="w-5 h-5 text-white" />
              <CaretDown weight="fill" className="w-4 h-4 text-red-500" />
              <span className="text-base text-white font-bold">{formatCompact(nextUpgrade.rpCost)}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
