"use client"

import { Brain, CurrencyDollar, UserPlus, CaretRight } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"

interface ActionsPanelProps {
  onStartAction: (action: any) => void
  cash: number
  compute: { current: number; max: number }
  staffCount: { current: number; max: number }
}

export function ActionsPanel({ onStartAction, cash, compute, staffCount }: ActionsPanelProps) {
  const actions = [
    {
      section: "AI TRAINING",
      items: [
        {
          name: "Train Small Model (3B)",
          cost: 500,
          duration: 300,
          rewards: "+120 RP, +5 Rep, +25 XP",
          icon: Brain,
          disabled: cash < 500 || compute.current >= compute.max,
        },
        {
          name: "Train Medium Model (7B)",
          cost: 1200,
          duration: 720,
          rewards: "+260 RP, +12 Rep, +60 XP",
          icon: Brain,
          disabled: cash < 1200 || compute.current >= compute.max,
        },
      ],
    },
    {
      section: "INCOME",
      items: [
        {
          name: "Freelance AI Contract",
          cost: 0,
          duration: 180,
          rewards: "+$400, +2 Rep, +10 XP",
          icon: CurrencyDollar,
          disabled: false,
        },
      ],
    },
    {
      section: "HIRING",
      subtitle: `(${staffCount.current}/${staffCount.max} Staff)`,
      items: [
        {
          name: "Hire Junior Researcher",
          cost: 1500,
          duration: 120,
          rewards: "+10% Research Speed, +1 Parallel Task",
          icon: UserPlus,
          disabled: cash < 1500 || staffCount.current >= staffCount.max,
        },
      ],
    },
  ]

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        {actions.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              {section.section}
              {section.subtitle && <span className="text-muted-foreground">{section.subtitle}</span>}
            </h3>
            <div className="space-y-2">
              {section.items.map((action) => (
                <button
                  key={action.name}
                  onClick={() => !action.disabled && onStartAction(action)}
                  disabled={action.disabled}
                  className="w-full p-3 rounded bg-secondary border border-border hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <action.icon weight="fill" className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">{action.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {action.cost > 0 ? `$${action.cost}` : "Free"} · {Math.floor(action.duration / 60)}m{" "}
                          {action.duration % 60}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-success font-medium">{action.rewards}</span>
                      {!action.disabled && (
                        <CaretRight
                          weight="bold"
                          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                        />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
