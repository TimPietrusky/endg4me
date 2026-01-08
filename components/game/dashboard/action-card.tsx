"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SpendButton, type SpendAttribute } from "./spend-button"
import { RequiresPanel } from "./requires-panel"
import { ActionCardDetails } from "./action-card-details"
import { Brain, CurrencyDollar, Users, Star, Trophy } from "@phosphor-icons/react"
import type { Action } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface ActionCardProps {
  action: Action
  onStartAction: (action: Action) => void
}

// Category-based styling for cards without images
const CATEGORY_STYLES: Record<string, { icon: typeof Brain; gradient: string; iconColor: string }> = {
  RESEARCH_MODEL: {
    icon: Brain,
    gradient: "from-purple-500/30 to-purple-500/10",
    iconColor: "text-purple-400",
  },
  RESEARCH_REVENUE: {
    icon: CurrencyDollar,
    gradient: "from-green-500/30 to-green-500/10",
    iconColor: "text-green-400",
  },
  RESEARCH_HIRING: {
    icon: Users,
    gradient: "from-blue-500/30 to-blue-500/10",
    iconColor: "text-blue-400",
  },
}

export function ActionCard({ action, onStartAction }: ActionCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  const isResearch = action.category.startsWith("RESEARCH_")
  const isCollection = action.category === "COLLECTION"
  const categoryStyle = CATEGORY_STYLES[action.category]

  // Check if action has unmet requirements
  const unmetRequirements = action.requirements?.filter(r => !r.met) || []
  const hasUnmetRequirements = unmetRequirements.length > 0

  const getButtonLabel = (action: Action): string => {
    if (action.category.startsWith("RESEARCH_")) {
      return "research"
    }
    switch (action.category) {
      case "TRAINING":
        return action.latestVersion ? "retrain" : "train"
      case "INCOME":
        return "do job"
      case "HIRING":
        return "hire"
      case "OPTIMIZATION":
        return "optimize"
      default:
        return "start"
    }
  }

  // Build attributes for SpendButton
  const buildAttributes = (): SpendAttribute[] => {
    // For research actions, show RP cost and time
    if (isResearch) {
      return [
        {
          type: "time",
          value: action.duration > 0 ? action.duration : undefined,
          isGain: true,
        },
        {
          type: "rp",
          // Pass 0 for free items (shows "free"), undefined for no RP display
          value: action.rpCost !== undefined ? action.rpCost : undefined,
          isGain: false,
        },
      ]
    }

    // For regular actions
    const hasCashCost = action.cost > 0
    const hasCashReward = action.cashReward && action.cashReward > 0
    const cashValue = hasCashCost ? action.cost : (hasCashReward ? action.cashReward : undefined)
    const isCashGain = !hasCashCost && !!hasCashReward
    const hasGpuCost = action.gpuCost && action.gpuCost > 0

    return [
      {
        type: "time",
        value: action.duration > 0 ? action.duration : undefined,
        isGain: true,
      },
      {
        type: "cash",
        value: cashValue,
        isGain: isCashGain,
      },
      {
        type: "gpu",
        value: hasGpuCost ? action.gpuCost : undefined,
        isGain: false,
      },
      {
        type: "rp",
        value: action.rpReward && action.rpReward > 0 ? action.rpReward : undefined,
        isGain: true,
      },
      {
        type: "xp",
        value: action.xpReward && action.xpReward > 0 ? action.xpReward : undefined,
        isGain: true,
      },
    ]
  }

  // Clickable title component with hover affordance
  const ClickableTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setDetailsOpen(true)
      }}
      className={cn(
        "cursor-pointer hover:underline decoration-white/50 underline-offset-2 transition-all",
        className
      )}
    >
      {children}
    </button>
  )

  // Clickable image area
  const handleImageClick = () => {
    setDetailsOpen(true)
  }

  // Render research cards - use image if available, otherwise icon
  if (isResearch) {
    const Icon = categoryStyle?.icon || Brain
    const hasImage = !!action.image
    
    // Completed/unlocked state - only checkmark is green, card uses normal styling
    const isCompleted = action.completed
    const cardGradient = categoryStyle?.gradient || "from-purple-500/30 to-purple-500/10"
    const iconColor = categoryStyle?.iconColor || "text-purple-400"
    
    // Blueprint mode: show schematic style for unresearched items (not completed, not actively researching)
    const showBlueprint = hasImage && !isCompleted && !action.isActive

    return (
      <>
        <Card className={cn(
          "overflow-hidden pt-0 pb-0 gap-0",
          action.locked && "opacity-60"
        )}>
          {/* Header - image if available, otherwise icon */}
          <div 
            className={cn(
              "relative h-36 overflow-hidden border-b border-border cursor-pointer",
              hasImage ? "bg-black" : cn("bg-gradient-to-br flex items-center justify-center", cardGradient)
            )}
            onClick={handleImageClick}
          >
            {hasImage ? (
              <>
                {showBlueprint && (
                  <div className="blueprint-overlay" />
                )}
                <img
                  src={action.image}
                  alt={action.name}
                  className={cn(
                    "w-full h-full object-cover",
                    showBlueprint && "blueprint-image"
                  )}
                />
              </>
            ) : (
              <Icon className={cn("w-16 h-16 opacity-50", iconColor)} weight="duotone" />
            )}
            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/90 px-2 py-1 rounded pointer-events-auto">
                {action.size && (
                  <span className="text-lg font-black text-white">{action.size}</span>
                )}
                <ClickableTitle>
                  <h3 className="font-bold text-lg text-white">{action.name}</h3>
                </ClickableTitle>
                {action.latestVersion && (
                  <span className="text-xs font-mono text-white/60 ml-1">v{action.latestVersion}</span>
                )}
              </div>
            </div>
            {/* Status badge - only for researching */}
            {action.isActive && !isCompleted && (
              <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
                RESEARCHING
              </div>
            )}
          </div>

          <CardContent className="p-0">
            {/* Show RequiresPanel if has unmet requirements AND not completed AND not active */}
            {hasUnmetRequirements && !isCompleted && !action.isActive ? (
              <>
                <RequiresPanel requirements={action.requirements!} />
                {/* Attribute grid below requires panel */}
                <AttributeGrid attributes={buildAttributes()} />
              </>
            ) : (
              <SpendButton
                label={getButtonLabel(action)}
                disabled={action.disabled}
                disabledReason={action.disabledReason}
                onAction={() => onStartAction(action)}
                isActive={action.isActive}
                duration={action.duration}
                remainingTime={action.remainingTime}
                speedFactor={action.speedFactor || 1}
                attributes={buildAttributes()}
                attributeLayout="compact"
                showConfirmation={!isCompleted}
                isMaxed={isCompleted}
                maxedLabel="unlocked"
                maxedSubLabel=""
              />
            )}
          </CardContent>
        </Card>
        
        <ActionCardDetails 
          action={action} 
          open={detailsOpen} 
          onOpenChange={setDetailsOpen}
          onStartAction={onStartAction}
        />
      </>
    )
  }

  // Collection card (Lab Models) - shows owned status with best score
  if (isCollection && action.versions) {
    return (
      <>
        <Card className="overflow-hidden pt-0 pb-0 gap-0">
          <div 
            className="relative h-36 overflow-hidden border-b border-border bg-black cursor-pointer"
            onClick={handleImageClick}
          >
            {action.image ? (
              <img
                src={action.image}
                alt={action.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500/30 to-violet-500/10 flex items-center justify-center">
                <Brain className="w-16 h-16 text-violet-400 opacity-50" weight="duotone" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded pointer-events-auto">
                {action.size && (
                  <span className="text-lg font-black text-white">{action.size}</span>
                )}
                <ClickableTitle>
                  <h3 className="font-bold text-lg text-white">{action.name}</h3>
                </ClickableTitle>
                {action.latestVersion && (
                  <span className="text-xs font-mono text-white/60 ml-1">v{action.latestVersion}</span>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Owned state display with best score and version count */}
            <SpendButton
              label="owned"
              isMaxed={true}
              onAction={() => {}}
              showConfirmation={false}
              attributes={[
                { type: "score", value: action.bestScore, isGain: true },
                { type: "versions", value: action.versionCount, isGain: true },
              ]}
              attributeLayout="compact"
            />
          </CardContent>
        </Card>
        
        <ActionCardDetails 
          action={action} 
          open={detailsOpen} 
          onOpenChange={setDetailsOpen}
          onStartAction={onStartAction}
        />
      </>
    )
  }

  // Regular action card with image
  return (
    <>
      <Card className="overflow-hidden pt-0 pb-0 gap-0">
        <div 
          className="relative h-36 overflow-hidden border-b border-border bg-black cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={action.image || "/placeholder.svg"}
            alt={action.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded pointer-events-auto">
              {action.size && (
                <span className="text-lg font-black text-white">{action.size}</span>
              )}
              <ClickableTitle>
                <h3 className="font-bold text-lg text-white">{action.name}</h3>
              </ClickableTitle>
              {action.latestVersion && (
                <span className="text-xs font-mono text-white/60 ml-1">v{action.latestVersion}</span>
              )}
            </div>
          </div>
          {action.isQueued && (
            <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
              QUEUED
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {/* Show RequiresPanel if has unmet requirements AND not currently active/queued */}
          {hasUnmetRequirements && !action.isActive && !action.isQueued ? (
            <>
              <RequiresPanel requirements={action.requirements!} />
              <AttributeGrid attributes={buildAttributes()} />
            </>
          ) : (
            <SpendButton
              label={getButtonLabel(action)}
              disabled={action.disabled}
              disabledReason={action.disabledReason}
              onAction={() => onStartAction(action)}
              isActive={action.isActive}
              duration={action.duration}
              remainingTime={action.remainingTime}
              speedFactor={action.speedFactor || 1}
              attributes={buildAttributes()}
            />
          )}
        </CardContent>
      </Card>
      
      <ActionCardDetails 
        action={action} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </>
  )
}

// Standalone attribute grid for use with RequiresPanel
function AttributeGrid({ attributes }: { attributes: SpendAttribute[] }) {
  const gridCols = attributes.length
  
  // Use compact (flex centered) layout for 2 or fewer items, grid for more
  const useCompact = gridCols <= 2
  
  const gridColsClass = 
    gridCols === 1 ? "grid-cols-1" :
    gridCols === 2 ? "grid-cols-2" :
    gridCols === 3 ? "grid-cols-3" :
    gridCols === 4 ? "grid-cols-4" :
    gridCols === 5 ? "grid-cols-[2fr_3fr_3fr_3fr_3fr]" :
    "grid-cols-5"

  return (
    <div className={cn(
      "py-2 bg-card border-b border-white/10",
      useCompact ? "flex justify-center" : `grid ${gridColsClass}`
    )}>
      {attributes.map((attr, i) => (
        <AttributeCell key={i} {...attr} />
      ))}
    </div>
  )
}

// Minimal attribute cell (simplified version of SpendButton's)
import { Clock, Cpu, Lightning, CaretUp, CaretDown, CurrencyDollar as Cash } from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import { formatCompact, formatTimeCompact } from "@/lib/utils"

function AttributeCell({ type, value, isGain = true }: SpendAttribute) {
  const ICONS: Record<string, typeof Clock | null> = {
    time: Clock,
    cash: Cash,
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
