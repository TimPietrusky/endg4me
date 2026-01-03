"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CurrencyDollar, Lightning, Star, Clock } from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import type { Action } from "@/lib/game-types"

interface ActionCardProps {
  action: Action
  onStartAction: (action: Action) => void
}

export function ActionCard({ action, onStartAction }: ActionCardProps) {
  const [displayTime, setDisplayTime] = useState(action.remainingTime || action.duration)
  const startTimeRef = useRef<number | null>(null)
  const initialTimeRef = useRef(action.remainingTime || action.duration)

  useEffect(() => {
    if (!action.isRunning) {
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
  }, [action.isRunning, action.remainingTime])

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

  const progressPercent = action.isRunning ? ((action.duration - displayTime) / action.duration) * 100 : 0

  const AttributeCell = ({
    icon: Icon,
    value,
    color,
    isTime = false,
    isXP = false,
  }: { icon?: React.ElementType; value?: number | string; color?: string; isTime?: boolean; isXP?: boolean }) => {
    // Always show icon if it exists, even without value
    if (!Icon && !isXP) {
      return <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0" />
    }

    const hasValue = value !== undefined && value !== null && value !== 0 && value !== ""

    if (isXP) {
      return (
        <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0">
          <XpIcon className={hasValue ? color : "text-gray-500 opacity-50"} />
          {hasValue && <span className="font-bold text-white text-sm">{value}</span>}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between px-2 border-r border-white/10 last:border-r-0">
        <Icon weight="bold" className={`w-4 h-4 flex-shrink-0 ${hasValue ? color : "text-gray-500 opacity-50"}`} />
        {hasValue && <span className="font-bold text-white text-sm">{isTime ? value : value}</span>}
      </div>
    )
  }

  const getAttributeGrid = () => {
    let cashValue: number | string | undefined
    if (action.cost > 0) {
      cashValue = `-${action.cost}`
    } else if (action.cashReward && action.cashReward > 0) {
      cashValue = `+${action.cashReward}`
    }

    return [
      {
        icon: Clock,
        value: action.duration > 0 ? formatTime(action.duration) : undefined,
        color: "text-muted-foreground",
        isTime: true,
      },
      {
        icon: CurrencyDollar,
        value: cashValue,
        color: "text-emerald-400",
      },
      {
        icon: Lightning,
        value: action.rpReward && action.rpReward > 0 ? action.rpReward : undefined,
        color: "text-amber-400",
      },
      {
        icon: Star,
        value: action.reputationReward && action.reputationReward > 0 ? action.reputationReward : undefined,
        color: "text-blue-400",
      },
      {
        icon: undefined,
        value: action.xpReward && action.xpReward > 0 ? action.xpReward : undefined,
        color: "text-primary",
        isXP: true,
      },
    ]
  }

  const attributeGrid = getAttributeGrid()

  return (
    <Card
      className={`overflow-hidden ${action.disabled && !action.isRunning ? "opacity-50" : ""} flex flex-col h-full`}
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
        {action.isRunning ? (
          <div className="w-full bg-muted/30 border-b border-border p-3 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-primary/20 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="flex items-center justify-center mb-2 relative z-10">
              <span className="text-3xl font-black text-white font-mono tabular-nums">{formatTime(displayTime)}</span>
            </div>

            <div className="grid grid-cols-5 relative z-10 py-2 bg-black/20 border border-white/10">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onStartAction(action)}
            disabled={action.disabled}
            className="w-full bg-muted/30 hover:bg-muted border-b border-border transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10">
              <CurrencyDollar
                weight="bold"
                className={`w-7 h-7 ${action.cost > 0 ? "text-emerald-400" : "text-gray-500 opacity-50"}`}
              />
              {action.cost > 0 && (
                <span className="text-3xl font-black text-white">{action.cost.toLocaleString()}</span>
              )}
            </div>

            <div className="grid grid-cols-5 py-2 bg-black/20">
              {attributeGrid.map((attr, i) => (
                <AttributeCell
                  key={i}
                  icon={attr.icon}
                  value={attr.value}
                  color={attr.color}
                  isTime={attr.isTime}
                  isXP={attr.isXP}
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
