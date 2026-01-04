"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useGameData } from "@/components/providers/game-data-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUp, Lock, Check, Cpu, Users, ListChecks, CaretDoubleUp } from "@phosphor-icons/react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"

export function UpgradesView() {
  const { userId } = useGameData()
  const { toast } = useToast()
  
  const upgradeDetails = useQuery(
    api.upgrades.getUpgradeDetails,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )
  
  const purchaseUpgrade = useMutation(api.upgrades.purchaseUpgrade)

  if (!upgradeDetails) {
    return <div className="py-4 text-white/60">Loading upgrades...</div>
  }

  const handleUpgrade = async (upgradeType: "queue" | "staff" | "compute") => {
    if (!userId) return
    
    try {
      const result = await purchaseUpgrade({ 
        userId: userId as Id<"users">, 
        upgradeType 
      })
      toast({
        title: "Upgrade Purchased",
        description: `${upgradeType} upgraded to rank ${result.newRank}`,
      })
    } catch (error: any) {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Could not purchase upgrade",
        variant: "destructive",
      })
    }
  }

  const getIcon = (id: string, size: "sm" | "md" = "md") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5"
    switch (id) {
      case "queue":
        return <ListChecks className={sizeClass} weight="bold" />
      case "staff":
        return <Users className={sizeClass} weight="bold" />
      case "compute":
        return <Cpu className={sizeClass} weight="bold" />
      default:
        return null
    }
  }

  const getUnitLabel = (id: string) => {
    switch (id) {
      case "queue":
        return "slots"
      case "staff":
        return "researchers"
      case "compute":
        return "compute units"
      default:
        return ""
    }
  }

  return (
    <div className="py-4 space-y-6">
      {/* UP Balance Header */}
      <div className="flex items-center justify-between p-4 border border-white/20 bg-white/5">
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Upgrade Points</div>
          <div className="text-3xl font-bold text-white font-mono flex items-center gap-2">
            <CaretDoubleUp className="w-7 h-7 text-primary" weight="bold" />
            {upgradeDetails.upgradePoints}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">Level {upgradeDetails.level}</div>
          <div className="text-xs text-white/40">+1 UP per level</div>
        </div>
      </div>

      {/* Upgrade Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {upgradeDetails.upgrades.map((upgrade) => (
          <Card key={upgrade.id} className="bg-black/40 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getIcon(upgrade.id)}
                <span>{upgrade.name}</span>
              </CardTitle>
              <p className="text-xs text-white/60">{upgrade.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Value */}
              <div className="text-center py-2 bg-white/5 border border-white/10">
                <div className="text-2xl font-bold font-mono text-white flex items-center justify-center gap-2">
                  {getIcon(upgrade.id, "sm")}
                  {upgrade.currentValue}
                </div>
                <div className="text-xs text-white/60">{getUnitLabel(upgrade.id)}</div>
              </div>

              {/* Rank Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Rank</span>
                  <span className="font-mono">
                    {upgrade.currentRank} / {upgrade.maxRank}
                  </span>
                </div>
                <Progress 
                  value={(upgrade.currentRank / upgrade.maxRank) * 100} 
                  className="h-1.5"
                />
              </div>

              {/* Next Upgrade Info */}
              {!upgrade.isMaxRank && (
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>Next rank:</span>
                  <span className="text-white font-mono flex items-center gap-1">
                    {getIcon(upgrade.id, "sm")}
                    {upgrade.nextValue}
                  </span>
                </div>
              )}

              {/* Upgrade Button */}
              {upgrade.isMaxRank ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" />
                  Max Rank
                </Button>
              ) : upgrade.canUpgrade ? (
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => handleUpgrade(upgrade.id as "queue" | "staff" | "compute")}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Upgrade
                  <CaretDoubleUp className="w-4 h-4 ml-1" weight="bold" />
                  <span className="font-mono">1</span>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {upgrade.lockReason}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-3 border border-white/10 bg-white/5 text-xs text-white/60 space-y-1">
        <p>Earn 1 UP each time you level up. Spend UP here to permanently upgrade your lab.</p>
        <p>Higher ranks unlock at higher levels. Plan your upgrades carefully - you cannot max everything.</p>
      </div>
    </div>
  )
}

