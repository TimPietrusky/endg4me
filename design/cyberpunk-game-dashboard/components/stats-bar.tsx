import { CurrencyDollar, Lightning, Star, Cpu } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"

interface StatsBarProps {
  cash: number
  researchPoints: number
  reputation: number
  compute: { current: number; max: number }
  showResearchPoints: boolean
}

export function StatsBar({ cash, researchPoints, reputation, compute, showResearchPoints }: StatsBarProps) {
  const stats = [
    { icon: CurrencyDollar, label: "Cash", value: `$${cash.toLocaleString()}`, color: "text-success", show: true },
    {
      icon: Lightning,
      label: "Research Points",
      value: researchPoints.toString(),
      color: "text-warning",
      show: showResearchPoints,
    },
    { icon: Star, label: "Reputation", value: reputation.toString(), color: "text-primary", show: true },
    {
      icon: Cpu,
      label: "Compute",
      value: `${compute.current}/${compute.max}`,
      color: "text-accent",
      show: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats
        .filter((stat) => stat.show)
        .map((stat) => (
          <Card key={stat.label} className="p-3 bg-card border-border">
            <div className="flex items-center gap-2">
              <stat.icon weight="fill" className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
    </div>
  )
}
