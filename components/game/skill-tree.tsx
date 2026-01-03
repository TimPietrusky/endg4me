"use client"

import { X, Queue, UsersThree, Cpu, Brain, CurrencyDollar, Users, Trophy, Atom, ArrowsOutCardinal, Lock } from "@phosphor-icons/react"
import { SKILL_TREE, type LevelUnlocks, type UnlockIcon } from "@/convex/lib/skillTree"

interface SkillTreeProps {
  currentLevel: number
  currentXp: number
  onClose: () => void
}

const ICON_MAP: Record<UnlockIcon, React.ElementType> = {
  queue: Queue,
  parallel: ArrowsOutCardinal,
  staff: UsersThree,
  gpu: Cpu,
  model: Brain,
  money: CurrencyDollar,
  clan: Users,
  leaderboard: Trophy,
  research: Atom,
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  capacity: { text: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  infrastructure: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  research: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  income: { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  social: { text: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
}

export function SkillTree({ currentLevel, currentXp, onClose }: SkillTreeProps) {
  const getStatus = (level: number): "completed" | "current" | "locked" => {
    if (level < currentLevel) return "completed"
    if (level === currentLevel) return "current"
    return "locked"
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-background/80 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">skill tree</h1>
          <p className="text-sm text-muted-foreground mt-1">
            level {currentLevel} / {currentXp.toLocaleString()} xp total
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-400" />
          <span>completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white" />
          <span>current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/20" />
          <span>locked</span>
        </div>
      </div>

      {/* Scrollable level list */}
      <div className="space-y-3">
        {SKILL_TREE.map((levelData) => (
          <LevelRow
            key={levelData.level}
            levelData={levelData}
            status={getStatus(levelData.level)}
          />
        ))}
      </div>
    </div>
  )
}

interface LevelRowProps {
  levelData: LevelUnlocks
  status: "completed" | "current" | "locked"
}

function LevelRow({ levelData, status }: LevelRowProps) {
  const isLocked = status === "locked"
  
  const borderColor = {
    completed: "border-cyan-400",
    current: "border-white",
    locked: "border-white/20",
  }[status]

  const bgColor = {
    completed: "bg-cyan-400/5",
    current: "bg-white/5",
    locked: "bg-white/[0.02]",
  }[status]

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} ${isLocked ? "opacity-60" : ""}`}>
      <div className="flex items-stretch">
        {/* Level badge */}
        <div className={`w-20 shrink-0 flex flex-col items-center justify-center p-4 border-r ${borderColor}`}>
          <div className={`text-3xl font-bold ${
            status === "completed" ? "text-cyan-400" : 
            status === "current" ? "text-white" : 
            "text-white/40"
          }`}>
            {levelData.level}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {levelData.xpRequired.toLocaleString()} XP
          </div>
          {status === "current" && (
            <div className="text-[9px] text-cyan-400 uppercase font-bold mt-1">current</div>
          )}
        </div>

        {/* Stats */}
        <div className={`w-32 shrink-0 flex flex-col justify-center gap-1 p-3 border-r ${borderColor} text-xs`}>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Queue</span>
            <span className="font-bold">{levelData.queueSlots}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Parallel</span>
            <span className="font-bold">{levelData.parallelTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Staff</span>
            <span className="font-bold">{levelData.staffCapacity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">GPUs</span>
            <span className="font-bold">{levelData.computeUnits}</span>
          </div>
        </div>

        {/* Unlocks */}
        <div className="flex-1 p-3 flex items-center gap-2 overflow-x-auto">
          {levelData.unlocks.map((unlock, idx) => {
            const Icon = ICON_MAP[unlock.icon]
            const colors = CATEGORY_COLORS[unlock.category]
            
            return (
              <div
                key={idx}
                className={`shrink-0 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} ${
                  isLocked ? "grayscale" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <Lock className="w-4 h-4 opacity-50" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <div>
                    <div className="text-sm font-medium whitespace-nowrap">{unlock.name}</div>
                    <div className="text-[10px] opacity-70 whitespace-nowrap">{unlock.description}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
