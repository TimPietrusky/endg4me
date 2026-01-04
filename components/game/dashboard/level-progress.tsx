"use client"

import Link from "next/link"

interface LevelProgressProps {
  level: number
  xp: number
  maxXp: number
}

export function LevelProgress({ level, xp, maxXp }: LevelProgressProps) {
  const progressPercent = Math.min((xp / maxXp) * 100, 100)

  return (
    <Link
      href="/lab/levels"
      className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
      title="View level progression and UP rewards"
    >
      {/* Level number - large */}
      <span className="text-xl font-bold text-white leading-none">{level}</span>
      
      {/* Right side: "level" text with progress bar below */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-white/70 lowercase leading-none">level</span>
        <div className="h-0.5 w-8 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

