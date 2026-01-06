"use client"

import { 
  User, 
  ChartLineUp, 
  Users, 
  Clock,
  CurrencyDollar,
  Flask
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FOUNDER_BONUSES } from "@/convex/lib/gameConfig"

interface TeamViewProps {
  founderName: string
  founderType: "technical" | "business"
  juniorResearchers: number
}

export function TeamView({ 
  founderName, 
  founderType, 
  juniorResearchers,
}: TeamViewProps) {
  const founderBonus = FOUNDER_BONUSES[founderType]

  // Get the primary bonus for this founder type
  const primaryBonus = founderType === "technical" 
    ? { label: "Speed", value: founderBonus.speed ?? 0, icon: Clock, color: "text-cyan-400" }
    : { label: "Money Multiplier", value: founderBonus.moneyMultiplier ?? 0, icon: CurrencyDollar, color: "text-emerald-400" }

  return (
    <div className="space-y-6 mt-4">
      {/* Core Team Section */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Core Team
        </h3>
        
        {/* Co-Founder Card */}
        <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Founder Avatar/Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5">
                  {founderType === "technical" ? (
                    <img 
                      src="/assets/founder-technical.jpg" 
                      alt={founderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center">
                        <ChartLineUp className="w-8 h-8 text-amber-300" weight="bold" />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{founderName}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">
                    {founderType} founder
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-white/20 rounded font-bold">
                CO-FOUNDER
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Founder Bonus */}
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Lab Bonus</p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                <primaryBonus.icon className={`w-6 h-6 ${primaryBonus.color}`} weight="duotone" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{primaryBonus.label}</span>
                </div>
                <span className={`text-lg font-bold ${primaryBonus.color}`}>
                  +{primaryBonus.value}%
                </span>
              </div>
            </div>

            {/* What this affects */}
            <div className="mt-4 p-3 bg-white/5 rounded border border-white/10">
              <p className="text-xs text-muted-foreground mb-2">What this affects</p>
              {founderType === "technical" ? (
                <ul className="text-xs space-y-1 text-white/70">
                  <li className="flex items-center gap-2">
                    <Flask className="w-3 h-3 text-cyan-400" />
                    All jobs complete 25% faster
                  </li>
                </ul>
              ) : (
                <ul className="text-xs space-y-1 text-white/70">
                  <li className="flex items-center gap-2">
                    <CurrencyDollar className="w-3 h-3 text-emerald-400" />
                    All money rewards increased by 50%
                  </li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts / Hires Section */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Active Hires
        </h3>

        {juniorResearchers > 0 ? (
          <div className="grid gap-3">
            {Array.from({ length: juniorResearchers }).map((_, i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Junior Researcher #{i + 1}</p>
                        <p className="text-xs text-muted-foreground">Temporary hire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Effect</p>
                        <p className="text-sm font-bold text-green-400">+1 Queue</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-white/20 rounded-lg">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No active hires</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hire staff in Operate to get temporary bonuses
            </p>
          </div>
        )}

      </div>

      {/* Hire History Section (placeholder) */}
      <div>
        <details className="group">
          <summary className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 cursor-pointer hover:text-white transition-colors list-none flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hire History
            <span className="text-xs font-normal">(coming soon)</span>
          </summary>
          <div className="text-center py-6 text-muted-foreground text-sm">
            Hire history tracking will be available in a future update.
          </div>
        </details>
      </div>
    </div>
  )
}
