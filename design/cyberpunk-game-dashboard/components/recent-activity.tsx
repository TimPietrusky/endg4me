import { ChartLine, Lightning, Trophy, Sparkle, UserPlus } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"

interface Activity {
  id: string
  type: "task_complete" | "level_up" | "unlock" | "hire_complete"
  title: string
  message: string
  timestamp: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const activityIcons = {
  task_complete: { icon: Lightning, color: "text-success" },
  level_up: { icon: Trophy, color: "text-warning" },
  unlock: { icon: Sparkle, color: "text-accent" },
  hire_complete: { icon: UserPlus, color: "text-primary" },
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <ChartLine weight="fill" className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Recent Activity</h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const { icon: Icon, color } = activityIcons[activity.type]
          return (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded bg-secondary border border-border">
              <div className={`w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon weight="fill" className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.message}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.timestamp}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
