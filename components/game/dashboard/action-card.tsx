"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SpendButton, type SpendAttribute } from "./spend-button"
import { Brain, CurrencyDollar, Users } from "@phosphor-icons/react"
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
  const isResearch = action.category.startsWith("RESEARCH_")
  const categoryStyle = CATEGORY_STYLES[action.category]

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

  // Build shortfalls for disabled state
  const buildShortfalls = () => {
    const shortfalls: Array<{ type: "cash" | "gpu" | "rp" | "up"; amount: number }> = []
    if (action.fundsShortfall != null && action.fundsShortfall > 0) {
      shortfalls.push({ type: "cash", amount: action.fundsShortfall })
    }
    if (action.gpuShortfall != null && action.gpuShortfall > 0) {
      shortfalls.push({ type: "gpu", amount: action.gpuShortfall })
    }
    if (action.rpShortfall != null && action.rpShortfall > 0) {
      shortfalls.push({ type: "rp", amount: action.rpShortfall })
    }
    return shortfalls
  }

  // Render research cards - use image if available, otherwise icon
  if (isResearch) {
    const Icon = categoryStyle?.icon || Brain
    const hasImage = !!action.image
    
    // Completed/unlocked state - only checkmark is green, card uses normal styling
    const isCompleted = action.completed
    const cardGradient = categoryStyle?.gradient || "from-purple-500/30 to-purple-500/10"
    const iconColor = categoryStyle?.iconColor || "text-purple-400"

    return (
      <Card className={cn(
        "overflow-hidden pt-0 pb-0 gap-0",
        action.locked && "opacity-60"
      )}>
        {/* Header - image if available, otherwise icon */}
        <div className={cn(
          "relative h-36 overflow-hidden border-b border-border",
          hasImage ? "bg-black" : cn("bg-gradient-to-br flex items-center justify-center", cardGradient)
        )}>
          {hasImage ? (
            <img
              src={action.image}
              alt={action.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon className={cn("w-16 h-16 opacity-50", iconColor)} weight="duotone" />
          )}
          <div className="absolute bottom-2 left-2 pointer-events-none flex flex-col items-start">
            {/* Prerequisite indicator - separate box above model name, touching */}
            {action.prerequisiteName && (
              <div className="bg-black/70 backdrop-blur-sm px-1.5 rounded-t">
                <span className="text-[10px] text-white/50 leading-tight">{action.prerequisiteName}</span>
              </div>
            )}
            <div className="flex items-baseline gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded">
              {action.size && (
                <span className="text-lg font-black text-white">{action.size}</span>
              )}
              <h3 className="font-bold text-lg text-white">{action.name}</h3>
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
          <SpendButton
            label={getButtonLabel(action)}
            disabled={action.disabled}
            disabledReason={action.disabledReason}
            onAction={() => onStartAction(action)}
            isActive={action.isActive}
            duration={action.duration}
            remainingTime={action.remainingTime}
            speedFactor={action.speedFactor || 1}
            shortfalls={buildShortfalls()}
            attributes={buildAttributes()}
            showConfirmation={!isCompleted}
            isMaxed={isCompleted}
            maxedLabel="unlocked"
            maxedSubLabel=""
          />
        </CardContent>
      </Card>
    )
  }

  // Regular action card with image
  return (
    <Card className="overflow-hidden pt-0 pb-0 gap-0">
      <div className="relative h-36 overflow-hidden border-b border-border bg-black">
        <img
          src={action.image || "/placeholder.svg"}
          alt={action.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <div className="flex items-baseline gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded">
            {action.size && (
              <span className="text-lg font-black text-white">{action.size}</span>
            )}
            <h3 className="font-bold text-lg text-white">{action.name}</h3>
          </div>
        </div>
        {/* Version badge for trained models */}
        {action.latestVersion && (
          <div className="absolute top-2 left-3 bg-black/70 text-white text-xs font-mono px-2 py-0.5 rounded pointer-events-none">
            v{action.latestVersion}
          </div>
        )}
        {action.isQueued && (
          <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
            QUEUED
          </div>
        )}
      </div>

      <CardContent className="p-0">
        <SpendButton
          label={getButtonLabel(action)}
          disabled={action.disabled}
          disabledReason={action.disabledReason}
          onAction={() => onStartAction(action)}
          isActive={action.isActive}
          duration={action.duration}
          remainingTime={action.remainingTime}
          speedFactor={action.speedFactor || 1}
          shortfalls={buildShortfalls()}
          attributes={buildAttributes()}
        />
      </CardContent>
    </Card>
  )
}

