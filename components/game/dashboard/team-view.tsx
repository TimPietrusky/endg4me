"use client"

import { 
  User, 
  Code, 
  ChartLineUp, 
  Users, 
  Clock,
  Briefcase,
  Lightning,
  CurrencyDollar,
  UserPlus
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FOUNDER_MODIFIERS } from "@/convex/lib/gameConstants"

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
  const modifiers = FOUNDER_MODIFIERS[founderType]

  // Format modifier as percentage string
  const formatModifier = (value: number) => {
    if (value === 1) return "base"
    const percent = Math.round((value - 1) * 100)
    return percent > 0 ? `+${percent}%` : `${percent}%`
  }

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
                  {/* Placeholder - shows icon, can be replaced with actual image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {founderType === "technical" ? (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center">
                        <Code className="w-8 h-8 text-cyan-300" weight="bold" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center">
                        <ChartLineUp className="w-8 h-8 text-amber-300" weight="bold" />
                      </div>
                    )}
                  </div>
                  {/* When you have a real image, use this instead:
                  <img 
                    src="/founder-avatar.jpg" 
                    alt={founderName}
                    className="w-full h-full object-cover"
                  />
                  */}
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
            {/* Abilities */}
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Abilities</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded">
                  <Lightning className="w-4 h-4 text-cyan-400" />
                  <span>Research Speed</span>
                  <span className={`ml-auto font-bold ${modifiers.researchSpeed > 1 ? "text-green-400" : modifiers.researchSpeed < 1 ? "text-red-400" : "text-muted-foreground"}`}>
                    {formatModifier(modifiers.researchSpeed)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span>Model Score</span>
                  <span className={`ml-auto font-bold ${modifiers.modelScore > 1 ? "text-green-400" : modifiers.modelScore < 1 ? "text-red-400" : "text-muted-foreground"}`}>
                    {formatModifier(modifiers.modelScore)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded">
                  <CurrencyDollar className="w-4 h-4 text-green-400" />
                  <span>Money Rewards</span>
                  <span className={`ml-auto font-bold ${modifiers.moneyRewards > 1 ? "text-green-400" : modifiers.moneyRewards < 1 ? "text-red-400" : "text-muted-foreground"}`}>
                    {formatModifier(modifiers.moneyRewards)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded">
                  <UserPlus className="w-4 h-4 text-yellow-400" />
                  <span>Hiring Speed</span>
                  <span className={`ml-auto font-bold ${modifiers.hiringSpeed > 1 ? "text-green-400" : modifiers.hiringSpeed < 1 ? "text-red-400" : "text-muted-foreground"}`}>
                    {formatModifier(modifiers.hiringSpeed)}
                  </span>
                </div>
              </div>
            </div>

            {/* What this affects */}
            <div className="mt-4 p-3 bg-white/5 rounded border border-white/10">
              <p className="text-xs text-muted-foreground mb-2">What this affects</p>
              {founderType === "technical" ? (
                <ul className="text-xs space-y-1 text-white/70">
                  <li>+ Faster research and training jobs</li>
                  <li>+ Higher quality trained models</li>
                  <li>- Lower cash rewards from contracts</li>
                </ul>
              ) : (
                <ul className="text-xs space-y-1 text-white/70">
                  <li>+ Higher cash rewards from contracts</li>
                  <li>+ Faster hiring process</li>
                  <li>- Slower research progress</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts / Hires Section */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Contracts / Hires
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
                        <p className="text-xs text-muted-foreground">Permanent hire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Effect</p>
                        <p className="text-sm font-bold text-green-400">+1 parallel task</p>
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
            <p className="text-sm text-muted-foreground">No active contracts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hire staff in Operate to expand your team
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

