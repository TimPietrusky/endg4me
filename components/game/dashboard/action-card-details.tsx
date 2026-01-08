"use client"

import { Brain, Star, Trophy, Clock, Cpu, Lightning, CaretUp, CaretDown, CurrencyDollar } from "@phosphor-icons/react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RequiresPanel } from "./requires-panel"
import { SpendButton, type SpendAttribute } from "./spend-button"
import { XpIcon } from "./xp-icon"
import type { Action, ActionVersion } from "@/lib/game-types"
import { cn, formatCompact, formatTimeCompact } from "@/lib/utils"

interface ActionCardDetailsProps {
  action: Action
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartAction?: (action: Action) => void
}

// Category-based styling (same as ActionCard)
const CATEGORY_STYLES: Record<string, { gradient: string; iconColor: string }> = {
  RESEARCH_MODEL: {
    gradient: "from-purple-500/30 to-purple-500/10",
    iconColor: "text-purple-400",
  },
  RESEARCH_REVENUE: {
    gradient: "from-green-500/30 to-green-500/10",
    iconColor: "text-green-400",
  },
  RESEARCH_HIRING: {
    gradient: "from-blue-500/30 to-blue-500/10",
    iconColor: "text-blue-400",
  },
  TRAINING: {
    gradient: "from-violet-500/30 to-violet-500/10",
    iconColor: "text-violet-400",
  },
  COLLECTION: {
    gradient: "from-violet-500/30 to-violet-500/10",
    iconColor: "text-violet-400",
  },
}

// Format date for version list
function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Version row for the versions list
function VersionRow({ version }: { version: ActionVersion }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2",
      version.isBest ? "bg-emerald-500/10" : "bg-white/5"
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground">v{version.version}</span>
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3" weight="fill" />
          <span className="text-xs font-bold">{version.score}</span>
        </div>
        {version.isBest && (
          <div className="flex items-center gap-1 text-emerald-400">
            <Trophy className="w-3 h-3" weight="fill" />
            <span className="text-xs font-medium">BEST</span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{formatDate(version.trainedAt)}</span>
    </div>
  )
}

export function ActionCardDetails({ action, open, onOpenChange, onStartAction }: ActionCardDetailsProps) {
  const hasImage = !!action.image
  const categoryStyle = CATEGORY_STYLES[action.category]
  const hasVersions = action.versions && action.versions.length > 0
  const isResearch = action.category.startsWith("RESEARCH_")
  const isCollection = action.category === "COLLECTION"
  
  // Check if action has unmet requirements
  const unmetRequirements = action.requirements?.filter(r => !r.met) || []
  const hasUnmetRequirements = unmetRequirements.length > 0

  const getButtonLabel = (): string => {
    if (isResearch) return "research"
    switch (action.category) {
      case "TRAINING":
        return action.latestVersion ? "retrain" : "train"
      case "INCOME":
        return "do job"
      case "HIRING":
        return "hire"
      default:
        return "start"
    }
  }

  // Build attributes for SpendButton (same logic as ActionCard)
  const buildAttributes = (): SpendAttribute[] => {
    if (isResearch) {
      return [
        { type: "time", value: action.duration > 0 ? action.duration : undefined, isGain: true },
        { type: "rp", value: action.rpCost !== undefined ? action.rpCost : undefined, isGain: false },
      ]
    }
    
    if (isCollection) {
      return [
        { type: "score", value: action.bestScore, isGain: true },
        { type: "versions", value: action.versionCount, isGain: true },
      ]
    }

    const hasCashCost = action.cost > 0
    const hasCashReward = action.cashReward && action.cashReward > 0
    const cashValue = hasCashCost ? action.cost : (hasCashReward ? action.cashReward : undefined)
    const isCashGain = !hasCashCost && !!hasCashReward
    const hasGpuCost = action.gpuCost && action.gpuCost > 0

    return [
      { type: "time", value: action.duration > 0 ? action.duration : undefined, isGain: true },
      { type: "cash", value: cashValue, isGain: isCashGain },
      { type: "gpu", value: hasGpuCost ? action.gpuCost : undefined, isGain: false },
      { type: "rp", value: action.rpReward && action.rpReward > 0 ? action.rpReward : undefined, isGain: true },
      { type: "xp", value: action.xpReward && action.xpReward > 0 ? action.xpReward : undefined, isGain: true },
    ]
  }

  const handleAction = () => {
    if (onStartAction) {
      onStartAction(action)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-transparent border-0 ring-0 shadow-none rounded-sm" showCloseButton={false}>
        <Card className="overflow-hidden pt-0 pb-0 gap-0 rounded-sm">
          {/* Large image header - same structure as ActionCard but taller */}
          <div className={cn(
            "relative h-56 overflow-hidden border-b border-border",
            hasImage ? "bg-black" : cn("bg-gradient-to-br flex items-center justify-center", categoryStyle?.gradient || "from-violet-500/30 to-violet-500/10")
          )}>
            {hasImage ? (
              <img
                src={action.image}
                alt={action.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Brain className={cn("w-24 h-24 opacity-50", categoryStyle?.iconColor || "text-violet-400")} weight="duotone" />
            )}
            
            {/* Title overlay - same as ActionCard */}
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-sm">
                {action.size && (
                  <span className="text-xl font-black text-white">{action.size}</span>
                )}
                <h3 className="font-bold text-xl text-white">{action.name}</h3>
                {action.latestVersion && (
                  <span className="text-sm font-mono text-white/60 ml-1">v{action.latestVersion}</span>
                )}
              </div>
            </div>
            
            {/* Status badge - positioned to not conflict with close button */}
            {action.isActive && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-sm">
                {isResearch ? "RESEARCHING" : "IN PROGRESS"}
              </div>
            )}
            
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-sm transition-colors"
            >
              ×
            </button>
          </div>

          {/* Extra info section - description and versions only (requirements handled by footer) */}
          {(action.description || hasVersions) && (
            <div className="px-4 py-3 space-y-3 border-b border-border bg-card/50">
              {/* Description */}
              {action.description && (
                <p className="text-sm text-muted-foreground">{action.description}</p>
              )}
              
              {/* Versions section - for collection/trained models */}
              {hasVersions && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Versions ({action.versionCount})
                  </h4>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto rounded-sm">
                    {action.versions!.map((version) => (
                      <VersionRow key={version.id} version={version} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer - same as ActionCard: RequiresPanel or SpendButton */}
          <CardContent className="p-0">
            {isCollection ? (
              // Collection cards show "owned" state
              <SpendButton
                label="owned"
                isMaxed={true}
                onAction={() => {}}
                showConfirmation={false}
                attributes={buildAttributes()}
                attributeLayout="compact"
              />
            ) : hasUnmetRequirements && !action.completed ? (
              // Show RequiresPanel + AttributeGrid (same as ActionCard)
              <>
                <RequiresPanel requirements={action.requirements!} />
                <AttributeGrid attributes={buildAttributes()} />
              </>
            ) : (
              // Normal action button
              <SpendButton
                label={getButtonLabel()}
                disabled={action.disabled}
                disabledReason={action.disabledReason}
                onAction={handleAction}
                isActive={action.isActive}
                duration={action.duration}
                remainingTime={action.remainingTime}
                speedFactor={action.speedFactor || 1}
                attributes={buildAttributes()}
                showConfirmation={!action.completed}
                isMaxed={action.completed}
                maxedLabel="unlocked"
                maxedSubLabel=""
              />
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

// Standalone attribute grid for use with RequiresPanel (copied from ActionCard)
function AttributeGrid({ attributes }: { attributes: SpendAttribute[] }) {
  const gridCols = attributes.length
  const gridColsClass = 
    gridCols === 1 ? "grid-cols-1" :
    gridCols === 2 ? "grid-cols-2" :
    gridCols === 3 ? "grid-cols-3" :
    gridCols === 4 ? "grid-cols-4" :
    gridCols === 5 ? "grid-cols-[2fr_3fr_3fr_3fr_3fr]" :
    "grid-cols-5"

  return (
    <div className={`grid ${gridColsClass} py-2 bg-card border-b border-white/10`}>
      {attributes.map((attr, i) => (
        <AttributeCell key={i} {...attr} />
      ))}
    </div>
  )
}

// Minimal attribute cell (same as ActionCard's)
function AttributeCell({ type, value, isGain = true }: SpendAttribute) {
  const ICONS: Record<string, typeof Clock | null> = {
    time: Clock,
    cash: CurrencyDollar,
    gpu: Cpu,
    rp: Lightning,
    xp: null,
  }
  
  const Icon = ICONS[type]
  const isXP = type === "xp"
  const isTime = type === "time"
  const isRP = type === "rp"
  
  const hasValue = value !== undefined && value !== null && value !== ""
  const isZero = value === 0
  const isFree = isRP && isZero && !isGain
  
  let displayValue: string | number | undefined = value
  if (hasValue && !isZero) {
    if (isTime) {
      displayValue = formatTimeCompact(Number(value))
    } else {
      displayValue = formatCompact(value)
    }
  } else if (isFree) {
    displayValue = "free"
  }

  const iconActive = hasValue && (!isZero || isFree)

  if (isXP) {
    return (
      <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0">
        <span className="w-3 flex items-center justify-center flex-shrink-0">
          <XpIcon className={iconActive ? "text-white" : "text-gray-500 opacity-50"} />
        </span>
        {iconActive && !isZero && (
          isGain 
            ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
        )}
        {iconActive && !isZero && <span className="text-white text-xs">{displayValue}</span>}
      </div>
    )
  }

  if (!Icon) {
    return <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0" />
  }

  return (
    <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0">
      <span className="w-3 flex items-center justify-center flex-shrink-0">
        <Icon weight="regular" className={`w-3 h-3 ${iconActive ? "text-white" : "text-gray-500 opacity-50"}`} />
      </span>
      {iconActive && !isTime && !isFree && (
        isGain 
          ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
          : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
      )}
      {iconActive && <span className="text-white text-xs">{displayValue}</span>}
    </div>
  )
}
