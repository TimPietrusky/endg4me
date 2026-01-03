import { Trophy } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PlayerLevelProps {
  level: number
  xp: { current: number; max: number }
  clansUnlocked: boolean
}

export function PlayerLevel({ level, xp, clansUnlocked }: PlayerLevelProps) {
  const efficiencyBonus = level * 5
  const progress = (xp.current / xp.max) * 100

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded bg-gradient-to-br from-warning to-destructive flex items-center justify-center flex-shrink-0">
          <Trophy weight="fill" className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Player Level</p>
          <h3 className="text-2xl font-bold text-foreground mb-1">Level {level}</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            <span className="tabular-nums">
              {xp.current} / {xp.max} XP
            </span>
            <span className="text-success">+{efficiencyBonus}% efficiency</span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          {!clansUnlocked && <p className="text-xs text-accent">Reach level 3 to unlock Clans</p>}
        </div>
      </div>
    </Card>
  )
}
