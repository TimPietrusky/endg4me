"use client"

import { useGameData } from "@/components/providers/game-data-provider"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { XP_REQUIREMENTS, RP_REWARDS } from "@/convex/lib/skillTree"
import { Lightning } from "@phosphor-icons/react"

export default function LevelPage() {
  const { playerState } = useGameData()
  
  const currentLevel = playerState?.level || 1
  const currentXp = playerState?.experience || 0
  const nextLevelXp = XP_REQUIREMENTS[currentLevel + 1] || Infinity
  const currentLevelXp = XP_REQUIREMENTS[currentLevel] || 0
  const xpProgress = nextLevelXp === Infinity 
    ? 100 
    : ((currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  return (
    <div className="pt-6">
      {/* Current level display */}
      <div className="mb-8 flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-white flex items-center justify-center">
            <span className="text-5xl font-black">{currentLevel}</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">level</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">XP Progress</span>
            <span className="font-mono">
              {currentXp.toLocaleString()} / {nextLevelXp === Infinity ? "MAX" : nextLevelXp.toLocaleString()}
            </span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          {currentLevel < 20 && (
            <p className="text-xs text-muted-foreground mt-2">
              {(nextLevelXp - currentXp).toLocaleString()} XP to level {currentLevel + 1}
            </p>
          )}
          {currentLevel >= 20 && (
            <p className="text-xs text-green-400 mt-2">Maximum level reached</p>
          )}
        </div>
      </div>

      {/* Level progression table */}
      <div className="border border-white/20 rounded-lg overflow-hidden max-w-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20 bg-white/5">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Level</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">XP</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-end gap-1">
                <Lightning className="w-3 h-3" />
                Reward
              </th>
              <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
              const isCurrentLevel = level === currentLevel
              const isCompleted = level < currentLevel
              const xpRequired = XP_REQUIREMENTS[level]
              const rpReward = RP_REWARDS[level] || 0
              
              return (
                <tr 
                  key={level}
                  className={cn(
                    "border-b border-white/10 transition-colors",
                    isCurrentLevel && "bg-white/10",
                    isCompleted && "opacity-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-bold text-lg",
                      isCurrentLevel && "text-white",
                      isCompleted && "text-muted-foreground"
                    )}>
                      {level}
                      {level === 20 && <span className="ml-2 text-xs text-muted-foreground font-normal">max</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {level === 1 ? "-" : xpRequired.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {rpReward > 0 && (
                      <span className="font-bold text-white flex items-center justify-end gap-1">
                        <Lightning className="w-4 h-4" />
                        +{rpReward.toLocaleString()}
                      </span>
                    )}
                    {rpReward === 0 && <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCompleted && (
                      <span className="text-xs text-green-400 uppercase">done</span>
                    )}
                    {isCurrentLevel && (
                      <span className="text-xs text-white uppercase font-bold">current</span>
                    )}
                    {!isCompleted && !isCurrentLevel && (
                      <span className="text-xs text-muted-foreground uppercase">locked</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Level up by earning XP from completing tasks. Each level grants Research Points (RP) that you can spend on upgrades in the Research tab.</p>
      </div>
    </div>
  )
}

