"use client"

import { 
  User, 
  ChartLineUp, 
  Users, 
  Clock,
  CurrencyDollar,
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
  // Speed: base 0% + bonus (shows what founder adds)
  // Money: base 1x + bonus (shows what founder adds on top of base)
  const speedBonus = founderBonus.speed ?? 0
  const moneyBonus = founderBonus.moneyMultiplier ?? 0
  
  const primaryBonus = founderType === "technical" 
    ? { 
        label: "speed", 
        baseValue: "0%",
        bonusValue: `+${speedBonus}%`, 
        icon: Clock, 
        color: "text-pink-400",
        bgColor: "bg-pink-500/20",
        borderColor: "border-pink-500/40",
        description: "all jobs complete faster"
      }
    : { 
        label: "money multiplier", 
        baseValue: "1x",
        bonusValue: `+${(moneyBonus / 100).toFixed(1)}x`, 
        icon: CurrencyDollar, 
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        borderColor: "border-emerald-500/40",
        description: "earn more revenue, pay less for costs"
      }

  return (
    <div className="space-y-6 mt-4">
      {/* core team section */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground lowercase tracking-wide mb-3">
          core team
        </h3>
        
        {/* co-founder card */}
        <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* founder avatar/image */}
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
                  <CardTitle className="text-base lowercase">{founderName}</CardTitle>
                  <p className="text-xs text-muted-foreground lowercase">
                    {founderType} founder
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-white/20 rounded font-bold lowercase">
                co-founder
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* founder bonus - prominent display */}
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2 lowercase">lab bonus</p>
              <div className={`rounded-lg border-2 overflow-hidden ${primaryBonus.bgColor} ${primaryBonus.borderColor}`}>
                {/* stat name header */}
                <div className="flex items-center gap-3 p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${primaryBonus.bgColor}`}>
                    <primaryBonus.icon className={`w-5 h-5 ${primaryBonus.color}`} weight="bold" />
                  </div>
                  <span className={`text-base font-bold ${primaryBonus.color} lowercase`}>
                    {primaryBonus.label}
                  </span>
                </div>
                {/* two-column base vs bonus */}
                <div className="grid grid-cols-2 gap-3 px-3 pb-3">
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">base</div>
                    <div className="text-xl font-mono text-white/50">
                      {primaryBonus.baseValue}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className={`text-[10px] uppercase tracking-wider mb-1 ${primaryBonus.color}`}>bonus</div>
                    <div className={`text-xl font-black ${primaryBonus.color}`}>
                      {primaryBonus.bonusValue}
                    </div>
                  </div>
                </div>
                {/* description */}
                <div className="px-4 py-2 bg-black/30 border-t border-white/10">
                  <p className="text-xs text-white/60 text-center lowercase">{primaryBonus.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* contracts / hires section */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground lowercase tracking-wide mb-3">
          active hires
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
                        <p className="font-medium text-sm lowercase">junior researcher #{i + 1}</p>
                        <p className="text-xs text-muted-foreground lowercase">temporary hire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground lowercase">effect</p>
                        <p className="text-sm font-bold text-green-400 lowercase">+1 queue</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded lowercase">
                        active
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
            <p className="text-sm text-muted-foreground lowercase">no active hires</p>
            <p className="text-xs text-muted-foreground mt-1 lowercase">
              hire staff in operate to get temporary bonuses
            </p>
          </div>
        )}

      </div>

      {/* hire history section (placeholder) */}
      <div>
        <details className="group">
          <summary className="text-sm font-bold text-muted-foreground lowercase tracking-wide mb-3 cursor-pointer hover:text-white transition-colors list-none flex items-center gap-2">
            <Clock className="w-4 h-4" />
            hire history
            <span className="text-xs font-normal lowercase">(coming soon)</span>
          </summary>
          <div className="text-center py-6 text-muted-foreground text-sm lowercase">
            hire history tracking will be available in a future update.
          </div>
        </details>
      </div>
    </div>
  )
}
