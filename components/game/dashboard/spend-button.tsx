"use client"

import { useState, useEffect, useRef } from "react"
import {
  CurrencyDollar,
  Lightning,
  Clock,
  CaretUp,
  CaretDown,
  Cpu,
  CaretDoubleUp,
  ListChecks,
  Users,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import { formatCompact, formatTimeCompact } from "@/lib/utils"

// Attribute types for the grid
export type AttributeType = "time" | "cash" | "gpu" | "rp" | "xp" | "up" | "queue" | "staff" | "compute" | "speed" | "moneyMultiplier"

export interface SpendAttribute {
  type: AttributeType
  value?: number | string
  isGain?: boolean // true = gain (green arrow up), false = cost (red arrow down)
}

export interface SpendButtonProps {
  // Button state
  label: string
  disabled?: boolean
  disabledReason?: string
  onAction: () => void
  
  // Confirmation
  showConfirmation?: boolean
  
  // Maxed/completed state
  isMaxed?: boolean
  maxedLabel?: string // defaults to "maxed"
  maxedSubLabel?: string // defaults to "fully upgraded"
  
  // Active/progress state (for timed actions)
  isActive?: boolean
  duration?: number // in seconds
  remainingTime?: number // in seconds
  speedFactor?: number
  
  // Shortfall display (for disabled state)
  shortfalls?: Array<{
    type: "cash" | "gpu" | "rp" | "up"
    amount: number
  }>
  
  // Attribute grid configuration
  attributes: SpendAttribute[]
  
  // Layout mode: "spread" fills width evenly, "compact" clusters items together
  attributeLayout?: "spread" | "compact"
}

// Icon mapping for attribute types
const ATTRIBUTE_ICONS: Record<AttributeType, PhosphorIcon | null> = {
  time: Clock,
  cash: CurrencyDollar,
  gpu: Cpu,
  rp: Lightning,
  xp: null, // XP uses custom XpIcon
  up: CaretDoubleUp,
  queue: ListChecks,
  staff: Users,
  compute: Cpu,
  speed: Clock, // Speed uses clock icon
  moneyMultiplier: CurrencyDollar,
}

// Format time as m:ss
function formatTimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// Single attribute cell in the grid
function AttributeCell({
  type,
  value,
  isGain = true,
}: SpendAttribute) {
  const Icon = ATTRIBUTE_ICONS[type]
  const isXP = type === "xp"
  const isTime = type === "time"
  
  const hasValue = value !== undefined && value !== null && value !== 0 && value !== ""
  
  // Format value based on type
  let displayValue: string | number | undefined = value
  if (hasValue) {
    if (isTime) {
      // Time value is in seconds, format to human readable
      displayValue = formatTimeCompact(Number(value))
    } else {
      displayValue = formatCompact(value)
    }
  }

  if (isXP) {
    return (
      <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0">
        <span className="w-3 flex items-center justify-center flex-shrink-0">
          <XpIcon className={hasValue ? "text-white" : "text-gray-500 opacity-50"} />
        </span>
        {hasValue && (
          isGain 
            ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
        )}
        {hasValue && <span className="text-white text-xs">{displayValue}</span>}
      </div>
    )
  }

  if (!Icon) {
    return <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0" />
  }

  return (
    <div className="flex items-center gap-1 px-2 border-r border-white/10 last:border-r-0">
      <span className="w-3 flex items-center justify-center flex-shrink-0">
        <Icon weight="regular" className={`w-3 h-3 ${hasValue ? "text-white" : "text-gray-500 opacity-50"}`} />
      </span>
      {hasValue && !isTime && (
        isGain 
          ? <CaretUp weight="fill" className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
          : <CaretDown weight="fill" className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
      )}
      {hasValue && <span className="text-white text-xs">{displayValue}</span>}
    </div>
  )
}

// Shortfall icons mapping
const SHORTFALL_ICONS: Record<string, PhosphorIcon> = {
  cash: CurrencyDollar,
  gpu: Cpu,
  rp: Lightning,
  up: CaretDoubleUp,
}

export function SpendButton({
  label,
  disabled = false,
  disabledReason,
  onAction,
  showConfirmation = true,
  isMaxed = false,
  maxedLabel = "maxed",
  maxedSubLabel = "fully upgraded",
  isActive = false,
  duration = 0,
  remainingTime = 0,
  speedFactor = 1,
  shortfalls = [],
  attributes,
  attributeLayout = "spread",
}: SpendButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [displayTime, setDisplayTime] = useState(
    isActive ? remainingTime * speedFactor : duration
  )
  const startTimeRef = useRef<number | null>(null)
  const initialTimeRef = useRef(isActive ? remainingTime * speedFactor : duration)

  // Progress animation for active state
  useEffect(() => {
    if (!isActive || duration === 0) {
      setDisplayTime(duration)
      return
    }

    startTimeRef.current = performance.now()
    initialTimeRef.current = remainingTime * speedFactor

    let rafId: number

    const tick = (now: number) => {
      if (!startTimeRef.current) return

      const elapsed = (now - startTimeRef.current) / 1000
      const newTime = Math.max(0, initialTimeRef.current - elapsed * speedFactor)
      setDisplayTime(newTime)

      if (newTime > 0) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isActive, remainingTime, speedFactor, duration])

  // Calculate progress percent
  const progressPercent = isActive && duration > 0 
    ? ((duration - displayTime) / duration) * 100 
    : 0

  // Compute grid columns based on attribute count (for spread layout)
  const gridCols = attributes.length
  const gridColsClass = 
    gridCols === 1 ? "grid-cols-1" :
    gridCols === 2 ? "grid-cols-2" :
    gridCols === 3 ? "grid-cols-3" :
    gridCols === 4 ? "grid-cols-4" :
    gridCols === 5 ? "grid-cols-[2fr_3fr_3fr_3fr_3fr]" :
    "grid-cols-5"

  // Attribute grid component (reused in all states) - always solid bg for clarity
  // "spread" = grid filling full width, "compact" = flex centered
  const AttributeGrid = ({ solid = false }: { solid?: boolean }) => (
    <div className={`${attributeLayout === "compact" ? "flex justify-center" : `grid ${gridColsClass}`} py-2 ${solid ? "bg-card" : "bg-card"}`}>
      {attributes.map((attr, i) => (
        <AttributeCell key={i} {...attr} />
      ))}
    </div>
  )

  // Active state with progress bar
  if (isActive && duration > 0) {
    return (
      <div className="w-full bg-muted/30 border-b border-border relative overflow-hidden">
        <div
          className="absolute inset-0 bg-primary/20 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="flex items-center justify-center h-[72px] border-b border-white/10 relative z-10">
          <span className="text-3xl font-black text-white font-mono tabular-nums">
            {formatTimeDisplay(displayTime)}
          </span>
        </div>
        <div className="relative z-10">
          <AttributeGrid />
        </div>
      </div>
    )
  }

  // Maxed/completed state - subtle and minimal
  if (isMaxed) {
    return (
      <div className="w-full border-t border-b border-white/10">
        <div className="flex items-center justify-center h-[72px] border-b border-white/10">
          <span className="text-lg text-white lowercase tracking-wider">
            {maxedLabel}
          </span>
        </div>
        <AttributeGrid solid />
      </div>
    )
  }

  // Confirmation state
  if (showConfirm && showConfirmation) {
    return (
      <div className="w-full bg-muted/30 border-b border-border">
        <div className="flex items-center justify-center gap-4 h-[72px] border-b border-white/10">
          <span className="text-lg font-bold text-muted-foreground lowercase">
            are you sure?
          </span>
          <button
            onClick={() => {
              onAction()
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
        <AttributeGrid />
      </div>
    )
  }

  // Disabled state
  if (disabled) {
    // Show shortfall badges if available, otherwise show disabled reason
    const hasShortfall = shortfalls.length > 0

    return (
      <div className="w-full border-b border-border">
        <div className="flex items-center justify-center h-[72px] border-b border-white/10 gap-3">
          {hasShortfall ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-red-400 lowercase">missing</span>
              <div className="flex items-center border border-red-500/50 rounded-md overflow-hidden">
                {shortfalls.map((shortfall, i) => {
                  const ShortfallIcon = SHORTFALL_ICONS[shortfall.type]
                  return (
                    <div key={i} className={`flex items-center gap-1.5 text-red-400 px-4 py-1.5 ${i > 0 ? "border-l border-red-500/50" : ""}`}>
                      <ShortfallIcon weight="bold" className="w-5 h-5" />
                      <span className="text-xl font-black">{formatCompact(shortfall.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <span className="text-xl font-bold text-muted-foreground lowercase">
              {disabledReason || "unavailable"}
            </span>
          )}
        </div>
        <AttributeGrid />
      </div>
    )
  }

  // Ready state (clickable) - muted glass, white bg on hover with black brackets
  return (
    <button
      onClick={() => showConfirmation ? setShowConfirm(true) : onAction()}
      className="w-full border-b border-border group cursor-pointer"
    >
      <div className="relative bg-white/10 group-hover:bg-white transition-colors">
        {/* Corner brackets - hidden by default, black/50 on hover */}
        {/* Top-left */}
        <div className="absolute top-2 left-2 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/50" />
          <div className="absolute top-0 left-0 w-[1px] h-full bg-black/50" />
        </div>
        {/* Top-right */}
        <div className="absolute top-2 right-2 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-0 right-0 w-full h-[1px] bg-black/50" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-black/50" />
        </div>
        {/* Bottom-left */}
        <div className="absolute bottom-2 left-2 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/50" />
          <div className="absolute bottom-0 left-0 w-[1px] h-full bg-black/50" />
        </div>
        {/* Bottom-right */}
        <div className="absolute bottom-2 right-2 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 right-0 w-full h-[1px] bg-black/50" />
          <div className="absolute bottom-0 right-0 w-[1px] h-full bg-black/50" />
        </div>
        
        <div className="flex items-center justify-center h-[72px] border-b border-white/10 group-hover:border-black/10 transition-colors">
          <span className="text-3xl font-black text-white/80 group-hover:text-black lowercase transition-colors">
            {label}
          </span>
        </div>
      </div>
      <AttributeGrid solid />
    </button>
  )
}

