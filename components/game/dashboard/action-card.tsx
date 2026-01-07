"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SpendButton, type SpendAttribute } from "./spend-button"
import type { Action } from "@/lib/game-types"

interface ActionCardProps {
  action: Action
  onStartAction: (action: Action) => void
}

export function ActionCard({ action, onStartAction }: ActionCardProps) {
  const getParameterColor = (size: string | undefined) => {
    if (!size) return "cyan"
    const value = Number.parseInt(size)
    if (value >= 13) return "red"
    if (value >= 7) return "purple"
    return "cyan"
  }

  const paramColor = getParameterColor(action.size)
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
    red: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-400",
  }

  const getButtonLabel = (action: Action): string => {
    switch (action.category) {
      case "TRAINING":
        // Show "retrain" if this model has been trained before
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
    return shortfalls
  }

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

{/* Description hidden for cleaner look
        <p className="text-sm text-white line-clamp-5 leading-relaxed p-3 text-left flex-1">{action.description}</p>
*/}
      </CardContent>
    </Card>
  )
}

