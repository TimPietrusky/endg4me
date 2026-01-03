"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CurrencyDollar, Lightning, Star, Clock, CaretUp, CaretDown } from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import type { Action } from "@/lib/game-types"
import { formatCompact, formatTimeCompact } from "@/lib/utils"

interface ActionCardProps {
  action: Action
  onStartAction: (action: Action) => void
}

export function ActionCard({ action, onStartAction }: ActionCardProps) {
  const [displayTime, setDisplayTime] = useState(action.remainingTime || action.duration)
  const [showConfirm, setShowConfirm] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const initialTimeRef = useRef(action.remainingTime || action.duration)

  useEffect(() => {
    if (!action.isActive) {
      setDisplayTime(action.remainingTime || action.duration)
      return
    }

    startTimeRef.current = performance.now()
    initialTimeRef.current = action.remainingTime || action.duration

    let rafId: number

    const tick = (now: number) => {
      if (!startTimeRef.current) return

      const elapsed = (now - startTimeRef.current) / 1000
      const newTime = Math.max(0, initialTimeRef.current - elapsed)
      setDisplayTime(newTime)

      if (newTime > 0) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [action.isActive, action.remainingTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

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

  const progressPercent = action.isActive ? ((action.duration - displayTime) / action.duration) * 100 : 0

  const getButtonLabel = (action: Action): string => {
    switch (action.category) {
      case "TRAINING":
        return "train"
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

  const AttributeCell = ({
    icon: Icon,
    value,
    color,
    isTime = false,
    isXP = false,
    isGain = true,
  }: { icon?: React.ElementType; value?: number | string; color?: string; isTime?: boolean; isXP?: boolean; isGain?: boolean }) => {
    if (!Icon && !isXP) {
      return <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0" />
    }

    const hasValue = value !== undefined && value !== null && value !== 0 && value !== ""
    
    // Format numeric values compactly (1200 → 1.2k)
    const displayValue = isTime ? value : formatCompact(value)

    if (isXP) {
      return (
        <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0">
          <div className="flex items-center gap-1">
            <span className="w-3 flex items-center justify-center flex-shrink-0">
              <XpIcon className={hasValue ? color : "text-gray-500 opacity-50"} />
            </span>
            {hasValue && <span className="text-white text-xs">{displayValue}</span>}
          </div>
          {hasValue && (
            isGain 
              ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
              : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0">
        <div className="flex items-center gap-1">
          <span className="w-3 flex items-center justify-center flex-shrink-0">
            <Icon weight="regular" className={`w-3 h-3 ${hasValue ? color : "text-gray-500 opacity-50"}`} />
          </span>
          {hasValue && <span className="text-white text-xs">{displayValue}</span>}
        </div>
        {hasValue && !isTime && (
          isGain 
            ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
        )}
      </div>
    )
  }

  const getAttributeGrid = () => {
    // Determine if cash is a cost (loss) or reward (gain)
    const hasCashCost = action.cost > 0
    const hasCashReward = action.cashReward && action.cashReward > 0
    const cashValue = hasCashCost ? action.cost : (hasCashReward ? action.cashReward : undefined)
    const isCashGain = !hasCashCost && hasCashReward

    return [
      {
        icon: Clock,
        value: action.duration > 0 ? formatTimeCompact(action.duration) : undefined,
        color: "text-white",
        isTime: true,
        isGain: true,
      },
      {
        icon: CurrencyDollar,
        value: cashValue,
        color: "text-white",
        isGain: isCashGain,
      },
      {
        icon: Lightning,
        value: action.rpReward && action.rpReward > 0 ? action.rpReward : undefined,
        color: "text-white",
        isGain: true,
      },
      {
        icon: undefined,
        value: action.xpReward && action.xpReward > 0 ? action.xpReward : undefined,
        color: "text-white",
        isXP: true,
        isGain: true,
      },
    ]
  }

  const attributeGrid = getAttributeGrid()

  return (
    <Card
      className="overflow-hidden flex flex-col h-full pt-0 gap-0"
    >
      <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${colorClasses[paramColor]}`}>
        <img
          src={action.image || "/placeholder.svg"}
          alt={action.name}
          className="w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className="absolute bottom-2 left-3 flex items-baseline gap-2">
          {action.size && (
            <span className={`text-xl font-black ${colorClasses[paramColor].split(" ").pop()}`}>{action.size}</span>
          )}
          <h3 className="font-bold text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{action.name}</h3>
        </div>
        {action.isQueued && (
          <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded">
            QUEUED
          </div>
        )}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        {action.isActive ? (
          <div className="w-full bg-muted/30 border-b border-border relative overflow-hidden">
            <div
              className="absolute inset-0 bg-primary/20 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="flex items-center justify-center h-[72px] border-b border-white/10 relative z-10">
              <span className="text-3xl font-black text-white font-mono tabular-nums">{formatTime(displayTime)}</span>
            </div>

            <div className="grid grid-cols-[2fr_3fr_3fr_3fr_3fr] relative z-10 py-2 bg-black/20">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
                  isGain={attr.isGain}
                />
              ))}
            </div>
          </div>
        ) : showConfirm ? (
          <div className="w-full bg-muted/30 border-b border-border">
            <div className="flex items-center justify-center gap-4 h-[72px] border-b border-white/10">
              <span className="text-lg font-bold text-muted-foreground lowercase">
                are you sure?
              </span>
              <button
                onClick={() => {
                  onStartAction(action)
                  setShowConfirm(false)
                }}
                className="px-4 py-1 text-lg font-black text-black bg-emerald-500 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-1 text-lg font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                no
              </button>
            </div>

            <div className="grid grid-cols-[2fr_3fr_3fr_3fr_3fr] py-2 bg-black/20">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
                  isGain={attr.isGain}
                />
              ))}
            </div>
          </div>
        ) : action.disabled ? (
          <div className="w-full bg-muted/30 border-b border-border">
            <div className="flex flex-col items-center justify-center h-[72px] border-b border-white/10 gap-1">
              <span className="text-lg font-bold text-muted-foreground lowercase">
                {action.disabledReason || "unavailable"}
              </span>
              {action.fundsShortfall != null && action.fundsShortfall > 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <span className="text-sm font-bold">need</span>
                  <CurrencyDollar weight="bold" className="w-4 h-4" />
                  <span className="text-sm font-bold">{formatCompact(action.fundsShortfall)} more</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[2fr_3fr_3fr_3fr_3fr] py-2 bg-black/20">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
                  isGain={attr.isGain}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-muted/30 hover:bg-muted border-b border-border transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-center h-[72px] border-b border-white/10">
              <span className="text-3xl font-black text-white lowercase">
                {getButtonLabel(action)}
              </span>
            </div>

            <div className="grid grid-cols-[2fr_3fr_3fr_3fr_3fr] py-2 bg-black/20">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
                  isGain={attr.isGain}
                />
              ))}
            </div>
          </button>
        )}

        <p className="text-sm text-white line-clamp-5 leading-relaxed p-3 text-left flex-1">{action.description}</p>
      </CardContent>
    </Card>
  )
}

