"use client"

import { XP_THRESHOLDS, MAX_LEVEL, UP_PER_LEVEL } from "@/convex/lib/gameConfig"
import { Check, ArrowRight, Star, CaretDoubleUp } from "@phosphor-icons/react"

interface LevelsViewProps {
  currentLevel: number
  currentXp: number
}

export function LevelsView({ currentLevel, currentXp }: LevelsViewProps) {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Current Progress</div>
          <div className="text-lg font-bold text-white">
            Level {currentLevel}
            <span className="text-white/40 mx-2">/</span>
            <span className="font-mono text-white/80">{currentXp.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">Total UP Earned</div>
          <div className="text-lg font-bold font-mono text-white flex items-center justify-end gap-1">
            <CaretDoubleUp className="w-5 h-5 text-primary" weight="bold" />
            {Math.max(0, currentLevel - 1)}
          </div>
        </div>
      </div>

      {/* Level Table */}
      <div className="border border-white/20 bg-black/20">
        {/* Header Row */}
        <div className="grid grid-cols-4 gap-2 p-2 border-b border-white/20 bg-white/5 text-xs text-white/60 uppercase tracking-wider">
          <div>Level</div>
          <div>XP Required</div>
          <div>UP Reward</div>
          <div className="text-right">Status</div>
        </div>

        {/* Level Rows */}
        <div className="divide-y divide-white/10">
          {levels.map((level) => {
            const xpThreshold = XP_THRESHOLDS[level]
            const isReached = currentLevel >= level
            const isCurrent = currentLevel === level
            const isNext = currentLevel === level - 1

            return (
              <div
                key={level}
                className={`grid grid-cols-4 gap-2 p-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-white/10 border-l-2 border-l-white"
                    : isNext
                      ? "bg-white/5"
                      : isReached
                        ? "opacity-60"
                        : ""
                }`}
              >
                {/* Level */}
                <div className="flex items-center gap-2">
                  {isCurrent && <ArrowRight className="w-3 h-3 text-white" weight="bold" />}
                  <span className={`font-mono ${isCurrent ? "text-white font-bold" : ""}`}>
                    {level}
                  </span>
                  {level === MAX_LEVEL && (
                    <Star className="w-3 h-3 text-yellow-400" weight="fill" />
                  )}
                </div>

                {/* XP Required */}
                <div className="font-mono text-white/80">
                  {level === 1 ? "-" : xpThreshold.toLocaleString()}
                </div>

                {/* UP Reward */}
                <div className="font-mono">
                  {level === 1 ? (
                    <span className="text-white/40">-</span>
                  ) : (
                    <span className="text-green-400 flex items-center gap-1">
                      +{UP_PER_LEVEL}
                      <CaretDoubleUp className="w-3 h-3" weight="bold" />
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="text-right">
                  {isReached ? (
                    <span className="inline-flex items-center gap-1 text-green-400">
                      <Check className="w-3 h-3" weight="bold" />
                      {isCurrent ? "Current" : "Done"}
                    </span>
                  ) : isNext ? (
                    <span className="text-white/80">Next</span>
                  ) : (
                    <span className="text-white/40">Locked</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 border border-white/10 bg-white/5 text-xs text-white/60 space-y-1">
        <p className="flex items-center gap-1 flex-wrap">
          XP is earned by completing jobs. Each level-up grants
          <span className="text-green-400 font-mono inline-flex items-center gap-0.5">
            +{UP_PER_LEVEL}
            <CaretDoubleUp className="w-3 h-3" weight="bold" />
          </span>
        </p>
        <p className="flex items-center gap-1 flex-wrap">
          Total available by level {MAX_LEVEL}:
          <span className="text-white font-mono inline-flex items-center gap-0.5">
            {MAX_LEVEL - 1}
            <CaretDoubleUp className="w-3 h-3" weight="bold" />
          </span>
        </p>
      </div>
    </div>
  )
}

