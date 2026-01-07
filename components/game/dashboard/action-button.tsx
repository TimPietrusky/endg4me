"use client"

import { cn } from "@/lib/utils"

export interface ActionButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  disabledLabel?: string
  /** Array of missing item labels to show in red badges when disabled */
  missingItems?: string[]
  isLoading?: boolean
  loadingLabel?: string
  className?: string
  size?: "default" | "large"
}

/**
 * Standalone action button with bracket hover effect.
 * Extracted from SpendButton's ready state for reuse.
 */
export function ActionButton({
  label,
  onClick,
  disabled = false,
  disabledLabel,
  missingItems = [],
  isLoading = false,
  loadingLabel = "loading...",
  className,
  size = "default",
}: ActionButtonProps) {
  const heightClass = size === "large" ? "h-[72px]" : "h-[56px]"
  const textClass = size === "large" ? "text-2xl" : "text-xl"

  // Disabled state with missing items
  if (disabled && !isLoading) {
    const hasMissing = missingItems.length > 0

    return (
      <div className={cn("w-full", className)}>
        <div className={cn(
          "flex items-center justify-center bg-card border border-border",
          heightClass
        )}>
          {hasMissing ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-red-400 lowercase">missing</span>
              <div className="flex items-center border border-red-500/50 rounded-md overflow-hidden">
                {missingItems.map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center text-red-400 px-4 py-1.5",
                    i > 0 && "border-l border-red-500/50"
                  )}>
                    <span className="text-lg font-bold lowercase">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span className={cn(
              "font-bold text-muted-foreground lowercase",
              textClass
            )}>
              {disabledLabel || label}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className={cn(
          "flex items-center justify-center gap-3 bg-white/10 border border-border",
          heightClass
        )}>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className={cn(
            "font-bold text-white/60 lowercase",
            textClass
          )}>
            {loadingLabel}
          </span>
        </div>
      </div>
    )
  }

  // Ready state (clickable)
  return (
    <button
      onClick={onClick}
      className={cn("w-full group cursor-pointer", className)}
    >
      <div className={cn(
        "relative bg-white/10 group-hover:bg-white transition-colors border border-transparent group-hover:border-white/20",
        heightClass
      )}>
        {/* Corner brackets - hidden by default, appear on hover */}
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

        <div className="flex items-center justify-center h-full">
          <span className={cn(
            "font-black text-white/80 group-hover:text-black lowercase transition-colors",
            textClass
          )}>
            {label}
          </span>
        </div>
      </div>
    </button>
  )
}

