"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Cpu, Users, ListChecks, CaretDoubleUp, Clock, CurrencyDollar, User } from "@phosphor-icons/react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { SpendButton } from "./spend-button"
import { RequiresPanel } from "./requires-panel"
import { cn } from "@/lib/utils"
import { LAB_UPGRADES } from "@/convex/lib/gameConfig"
import type { ActionRequirement } from "@/lib/game-types"

type UpgradeType = "queue" | "staff" | "compute" | "speed" | "moneyMultiplier"

// UP upgrade squares - what you can purchase with UP
function UpgradeSquares({ 
  upgradeType,
  currentRank,
  maxRank,
  accentClass,
}: { 
  upgradeType: UpgradeType
  currentRank: number
  maxRank: number
  accentClass: string
}) {
  const def = LAB_UPGRADES[upgradeType]
  const isCapacity = !def.isPercent && !def.isMultiplier
  
  // For capacity stats, show actual values (base + ranks)
  // For percent/multiplier, show ranks only
  const totalSquares = isCapacity ? def.base + maxRank : maxRank
  const filledSquares = isCapacity ? def.base + currentRank : currentRank
  
  const size = "w-5 h-5"
  
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: totalSquares }).map((_, i) => (
        <div
          key={`up-${i}`}
          className={cn(
            size,
            "rounded-sm border transition-all",
            i < filledSquares
              ? cn(accentClass, "border-transparent")
              : "bg-white/5 border-white/20"
          )}
        />
      ))}
    </div>
  )
}

// Bonus squares row - founder and hire bonuses with values
function BonusRow({
  founderBonus,
  hireBonus,
  isPercent,
  isMultiplier,
  accentBg,
  accentText,
}: {
  founderBonus: number
  hireBonus: number
  isPercent?: boolean
  isMultiplier?: boolean
  accentBg: string
  accentText: string
}) {
  const formatBonus = (val: number) => {
    if (isMultiplier) return val > 0 ? `+${(val / 100).toFixed(1)}x` : "0x"
    if (isPercent) return val > 0 ? `+${val}%` : "0%"
    return val > 0 ? `+${val}` : "0"
  }

  const size = "w-5 h-5"
  const hasFounder = founderBonus > 0
  const hasHire = hireBonus > 0

  return (
    <div className="flex items-center justify-center gap-6 min-h-[44px]">
      {/* Founder bonus - only show if this stat has a founder bonus */}
      {hasFounder && (
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              size,
              "rounded-sm border border-transparent flex items-center justify-center",
              accentBg
            )}
          >
            <span className="text-[10px] font-black text-white leading-none">F</span>
          </div>
          <span className={cn("text-xs font-mono font-medium", accentText)}>
            {formatBonus(founderBonus)}
          </span>
        </div>
      )}
      
      {/* Hire bonus - always show, muted when 0 */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            size,
            "rounded-sm border flex items-center justify-center transition-all",
            hasHire
              ? cn(accentBg, "border-transparent")
              : "bg-transparent border-white/20"
          )}
        >
          <User 
            className={cn("w-3 h-3", hasHire ? "text-white" : "text-white/20")} 
            weight="bold" 
          />
        </div>
        <span className={cn(
          "text-xs font-mono font-medium",
          hasHire ? accentText : "text-white/20"
        )}>
          {formatBonus(hireBonus)}
        </span>
      </div>
    </div>
  )
}

// Accent colors per upgrade type
const UPGRADE_ACCENTS = {
  queue: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30" },
  staff: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30" },
  compute: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30" },
  speed: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/30" },
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
      case "speed":
        return Clock
      case "moneyMultiplier":
        return CurrencyDollar
      default:
        return ListChecks
    }
  }

  // Format display value based on type
  const formatValue = (val: number, isPercent?: boolean, isMultiplier?: boolean) => {
    if (isMultiplier) {
      return `${(val / 100).toFixed(1)}x`
    }
    if (isPercent) {
      return `${val}%`
    }
    return val
  }

  return (
    <div className="py-4 flex flex-col h-[calc(100vh-180px)]">
      {/* Upgrade Cards - 5 columns on large screens */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {upgradeDetails.upgrades.map((upgrade) => {
          const isDisabled = !upgrade.canUpgrade
          const disabledReason = upgrade.isMaxRank ? "max rank" : upgrade.lockReason
          const Icon = getIcon(upgrade.id)
          const accent = UPGRADE_ACCENTS[upgrade.id as keyof typeof UPGRADE_ACCENTS]

          return (
            <Card key={upgrade.id} className="bg-black/40 border-border overflow-hidden flex flex-col pt-0 pb-0 gap-0">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Main visual display - fixed height structure */}
                <div className="px-4 py-6 flex-1 flex flex-col items-center justify-between gap-4">
                  {/* Icon + Large number row */}
                  <div className="flex items-center justify-center gap-4 w-full">
                    <Icon className={cn("w-12 h-12", accent.text)} weight="duotone" />
                    <span className={cn("text-6xl font-black font-mono leading-none", accent.text)}>
                      {formatValue(upgrade.currentValue, upgrade.isPercent, upgrade.isMultiplier)}
                    </span>
                  </div>
                  
                  {/* Row 1: UP upgrade squares */}
                  <UpgradeSquares
                    upgradeType={upgrade.id as UpgradeType}
                    currentRank={upgrade.currentRank}
                    maxRank={upgrade.maxRank}
                    accentClass={accent.bg}
                  />
                  
                  {/* Row 2: Bonus squares with values */}
                  <BonusRow
                    founderBonus={upgrade.founderBonus}
                    hireBonus={upgrade.hireBonus}
                    isPercent={upgrade.isPercent}
                    isMultiplier={upgrade.isMultiplier}
                    accentBg={accent.bg}
                    accentText={accent.text}
                  />
                  
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
                        type: upgrade.id as "queue" | "staff" | "compute" | "speed" | "moneyMultiplier", 
                        value: upgrade.isPercent ? "5%" : upgrade.isMultiplier ? "0.1x" : 1, 
                        isGain: true 
                      },
                    ]}
                    attributeLayout="compact"
                  />
                ) : (() => {
                  // Build requirements array for RequiresPanel
                  const requirements: ActionRequirement[] = []
                  
                  // Level requirement
                  if (upgrade.requiredLevelForNext && upgrade.requiredLevelForNext > upgradeDetails.level) {
                    requirements.push({
                      type: 'level',
                      label: String(upgrade.requiredLevelForNext),
                      met: false,
                      navigable: true,
                      link: { view: 'lab/levels' }
                    })
                  }
                  
                  const hasUnmetRequirements = requirements.some(r => !r.met)
                  
                  return hasUnmetRequirements ? (
                    <>
                      <RequiresPanel requirements={requirements} />
                      <div className="grid grid-cols-2 py-2 bg-card">
                        <div className="flex items-center gap-1 px-2 border-r border-white/10 justify-center">
                          <CaretDoubleUp weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />
                        </div>
                        <div className="flex items-center gap-1 px-2 justify-center">
                          {upgrade.id === "queue" && <ListChecks weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />}
                          {upgrade.id === "staff" && <Users weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />}
                          {upgrade.id === "compute" && <Cpu weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />}
                          {upgrade.id === "speed" && <Clock weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />}
                          {upgrade.id === "moneyMultiplier" && <CurrencyDollar weight="regular" className="w-3 h-3 text-gray-500 opacity-50" />}
                        </div>
                      </div>
                    </>
                  ) : (
                    <SpendButton
                      label="upgrade"
                      disabled={isDisabled}
                      disabledReason={disabledReason}
                      onAction={() => handleUpgrade(upgrade.id as UpgradeType)}
                      showConfirmation={false}
                      attributes={[
                        { type: "up", value: 1, isGain: false },
                        { 
                          type: upgrade.id as "queue" | "staff" | "compute" | "speed" | "moneyMultiplier", 
                          value: upgrade.isPercent ? "5%" : upgrade.isMultiplier ? "0.1x" : 1, 
                          isGain: true 
                        },
                      ]}
                      attributeLayout="compact"
                    />
                  )
                })()}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* UP Balance - industrial bank note style */}
      <div className="flex-1 flex items-center justify-center">
        <div className="inline-block">
          {/* Main content - two column layout */}
          <div className="flex items-center">
            {/* Left: Label - aligned right */}
            <div className="p-10 text-right">
              <div className="text-8xl font-black text-violet-400/30 uppercase leading-none tracking-tight">
                upgrade
              </div>
              <div className="text-8xl font-black text-violet-400/30 uppercase leading-none tracking-tight">
                points
              </div>
            </div>
            
            {/* Right: Icon + Value - aligned left */}
            <div className="p-10 flex items-center justify-start gap-8">
              <CaretDoubleUp className="w-32 h-32 text-violet-400" weight="bold" />
              <span className="text-[12rem] font-black text-violet-400 font-mono leading-none">
                {upgradeDetails.upgradePoints}
              </span>
            </div>
          </div>
          
          {/* Bottom decorative line */}
          <div className="h-1.5 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        </div>
      </div>
    </div>
  )
}
