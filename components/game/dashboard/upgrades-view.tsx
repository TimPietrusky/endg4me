"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Cpu, Users, ListChecks, CaretDoubleUp, Lightning, CurrencyDollar } from "@phosphor-icons/react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { SpendButton } from "./spend-button"
import { cn } from "@/lib/utils"

type UpgradeType = "queue" | "staff" | "compute" | "researchSpeed" | "moneyMultiplier"

// Visual squares component - shrinks to fit
function CapacitySquares({ 
  current, 
  max, 
  accentClass,
  maxLabel
}: { 
  current: number
  max: number
  accentClass: string
  maxLabel?: string
}) {
  // Use smaller squares for more items
  const size = max > 5 ? "w-4 h-4" : "w-5 h-5"
  const gapClass = max > 5 ? "gap-1" : "gap-1.5"
  
  return (
    <div className={cn("flex items-center", gapClass)}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            size,
            "rounded-sm border transition-all",
            i < current
              ? cn(accentClass, "border-transparent")
              : "bg-white/5 border-white/20"
          )}
        />
      ))}
      {maxLabel && (
        <span className="text-xs text-white/40 font-mono">
          {maxLabel}
        </span>
      )}
    </div>
  )
}

// Accent colors per upgrade type
const UPGRADE_ACCENTS = {
  queue: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30" },
  staff: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30" },
  compute: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30" },
  researchSpeed: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/30" },
  moneyMultiplier: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
}

export function UpgradesView() {
  const { userId } = useGameData()
  const { toast } = useToast()
  
  const upgradeDetails = useQuery(
    api.upgrades.getUpgradeDetails,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )
  
  const purchaseUpgrade = useMutation(api.upgrades.purchaseUpgrade)

  if (!upgradeDetails) {
    return <div className="py-4 text-white/60">Loading upgrades...</div>
  }

  const handleUpgrade = async (upgradeType: UpgradeType) => {
    if (!userId) return
    
    try {
      const result = await purchaseUpgrade({ 
        userId: userId as Id<"users">, 
        upgradeType 
      })
      toast({
        title: "Upgrade Purchased",
        description: `${upgradeType} upgraded to rank ${result.newRank}`,
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not purchase upgrade"
      toast({
        title: "Upgrade Failed",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const getIcon = (id: string) => {
    switch (id) {
      case "queue":
        return ListChecks
      case "staff":
        return Users
      case "compute":
        return Cpu
      case "researchSpeed":
        return Lightning
      case "moneyMultiplier":
        return CurrencyDollar
      default:
        return ListChecks
    }
  }

  return (
    <div className="py-4 space-y-6">
      {/* UP Balance Header */}
      <div className="flex items-center justify-between p-4 border border-white/20 bg-white/5">
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Upgrade Points</div>
          <div className="text-3xl font-bold text-white font-mono flex items-center gap-2">
            <CaretDoubleUp className="w-7 h-7 text-primary" weight="bold" />
            {upgradeDetails.upgradePoints}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">Level {upgradeDetails.level}</div>
          <div className="text-xs text-white/40">+1 UP per level</div>
        </div>
      </div>

      {/* Upgrade Cards - 5 columns on large screens */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {upgradeDetails.upgrades.map((upgrade) => {
          const isDisabled = !upgrade.canUpgrade
          const disabledReason = upgrade.isMaxRank ? "max rank" : upgrade.lockReason
          const upShortfall = !upgrade.canUpgrade && !upgrade.isMaxRank && upgradeDetails.upgradePoints < 1 
            ? 1 - upgradeDetails.upgradePoints 
            : 0
          
          const Icon = getIcon(upgrade.id)
          const accent = UPGRADE_ACCENTS[upgrade.id as keyof typeof UPGRADE_ACCENTS]
          
          // Format display value based on type
          const formatValue = (val: number) => {
            if (upgrade.isMultiplier) {
              return `${(val / 100).toFixed(1)}x`
            }
            if (upgrade.isPercent) {
              return `${val}%`
            }
            return val
          }
          
          // For percent/multiplier, use rank for squares instead of value
          const squaresCurrent = (upgrade.isPercent || upgrade.isMultiplier) 
            ? upgrade.currentRank + (upgrade.founderBonus > 0 ? 1 : 0)  // +1 if has founder bonus
            : upgrade.currentValue
          const squaresMax = (upgrade.isPercent || upgrade.isMultiplier)
            ? upgrade.maxRank + (upgrade.founderBonus > 0 ? 1 : 0)  // +1 if has founder bonus
            : upgrade.maxValue

          return (
            <Card key={upgrade.id} className="bg-black/40 border-border overflow-hidden flex flex-col pt-0 pb-0 gap-0">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Main visual display */}
                <div className="px-4 py-6 flex-1 flex flex-col items-center justify-center gap-4">
                  {/* Icon + Large number row */}
                  <div className="flex items-center justify-center gap-4 w-full">
                    <Icon className={cn("w-12 h-12", accent.text)} weight="duotone" />
                    <span className={cn("text-6xl font-black font-mono leading-none", accent.text)}>
                      {formatValue(upgrade.currentValue)}
                    </span>
                  </div>
                  
                  {/* Capacity squares with max value */}
                  <div className="flex items-center justify-center">
                    <CapacitySquares 
                      current={squaresCurrent} 
                      max={squaresMax} 
                      accentClass={accent.bg}
                      maxLabel={formatValue(upgrade.maxValue)}
                    />
                  </div>
                  
                  {/* Name with accent styling */}
                  <div className={cn(
                    "text-xs font-bold lowercase tracking-widest text-center opacity-80",
                    accent.text
                  )}>
                    {upgrade.name}
                  </div>
                </div>

                {/* Action Button */}
                {upgrade.isMaxRank ? (
                  <SpendButton
                    label="maxed"
                    isMaxed={true}
                    onAction={() => {}}
                    showConfirmation={false}
                    attributes={[
                      { type: "up", value: 1, isGain: false },
                      { 
                        type: upgrade.id as "queue" | "staff" | "compute" | "researchSpeed" | "moneyMultiplier", 
                        value: upgrade.isPercent ? "5%" : upgrade.isMultiplier ? "0.1x" : 1, 
                        isGain: true 
                      },
                    ]}
                    attributeLayout="compact"
                  />
                ) : (
                  <SpendButton
                    label="upgrade"
                    disabled={isDisabled}
                    disabledReason={disabledReason}
                    onAction={() => handleUpgrade(upgrade.id as UpgradeType)}
                    showConfirmation={false}
                    shortfalls={upShortfall > 0 ? [{ type: "up", amount: upShortfall }] : []}
                    attributes={[
                      { type: "up", value: 1, isGain: false },
                      { 
                        type: upgrade.id as "queue" | "staff" | "compute" | "researchSpeed" | "moneyMultiplier", 
                        value: upgrade.isPercent ? "5%" : upgrade.isMultiplier ? "0.1x" : 1, 
                        isGain: true 
                      },
                    ]}
                    attributeLayout="compact"
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

