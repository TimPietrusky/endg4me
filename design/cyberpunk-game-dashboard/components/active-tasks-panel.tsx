import { Clock, Queue, LockKey } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Task {
  id: string
  name: string
  timeRemaining: number
  duration: number
}

interface ActiveTasksPanelProps {
  activeTasks: Task[]
  queuedTasks: Task[]
  queueSlots: number
  parallelSlots: number
  playerLevel: number
}

export function ActiveTasksPanel({
  activeTasks,
  queuedTasks,
  queueSlots,
  parallelSlots,
  playerLevel,
}: ActiveTasksPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  const queueUnlocked = playerLevel >= 2

  return (
    <Card className="p-6 bg-card border-border h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock weight="fill" className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Active Tasks</h3>
        </div>
        {parallelSlots > 1 && (
          <span className="text-xs text-muted-foreground">
            ({activeTasks.length}/{parallelSlots} slots)
          </span>
        )}
      </div>

      {activeTasks.length === 0 && queuedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock weight="thin" className="w-16 h-16 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No active tasks</p>
          <p className="text-xs text-muted-foreground">Start an action to begin!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTasks.map((task) => {
            const progress = ((task.duration - task.timeRemaining) / task.duration) * 100
            return (
              <div key={task.id} className="p-3 rounded bg-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{task.name}</p>
                  <span className="text-xs text-accent font-mono tabular-nums">{formatTime(task.timeRemaining)}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )
          })}

          {queueUnlocked && queuedTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <Queue weight="fill" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Queued ({queuedTasks.length}/{queueSlots} slots)
                </h4>
              </div>

              {queuedTasks.map((task) => (
                <div key={task.id} className="p-3 rounded bg-muted border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{task.name}</p>
                    <span className="text-xs text-muted-foreground">Waiting</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {!queueUnlocked && (
            <div className="p-3 rounded bg-muted/30 border border-border/50 flex items-center gap-3">
              <LockKey weight="fill" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Task Queue Locked</p>
                <p className="text-xs text-muted-foreground">Reach level 2 to unlock 1 queue slot</p>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Level {playerLevel + 2}: +1 queue slot</p>
          </div>
        </div>
      )}
    </Card>
  )
}
