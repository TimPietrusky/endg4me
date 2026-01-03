"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CurrencyDollar, Lightning, Star } from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import type { GameState, ViewType } from "@/lib/game-types"

interface TopNavProps {
  gameState: GameState
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  notificationCount: number
  showTooltips: boolean
  setShowTooltips: (show: boolean) => void
  actionsCount: number
}

export function TopNav({
  gameState,
  currentView,
  setCurrentView,
  notificationCount,
  showTooltips,
  setShowTooltips,
  actionsCount,
}: TopNavProps) {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Lab name and level */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Star weight="fill" className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{gameState.playerName}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    TF
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("tasks")}
                className={`text-xs h-8 lowercase ${
                  currentView === "tasks"
                    ? "bg-primary text-black font-bold hover:text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
              >
                tasks
                {actionsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1">
                    {actionsCount}
                  </Badge>
                )}
              </Button>
              {gameState.modelsTrained > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("models")}
                  className={`text-xs h-8 lowercase ${
                    currentView === "models"
                      ? "bg-primary text-black font-bold hover:text-white hover:bg-primary/90"
                      : "hover:bg-muted"
                  }`}
                >
                  models
                  <Badge variant="secondary" className="ml-1 h-4 px-1">
                    {gameState.modelsTrained}
                  </Badge>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("msgs")}
                className={`text-xs h-8 lowercase ${
                  currentView === "msgs"
                    ? "bg-primary text-black font-bold hover:text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
              >
                msg
                {notificationCount > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({notificationCount})</span>
                )}
              </Button>
            </div>
          </div>

          {/* Right Side - Stats and Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-1.5 text-sm cursor-help"
                title={showTooltips ? "Player Level - Unlock new features as you level up" : undefined}
              >
                <span className="text-xs font-bold text-muted-foreground lowercase">level</span>
                <span className="text-base font-bold text-white">{gameState.level}</span>
              </div>

              <div
                className="flex items-center gap-1.5 text-sm cursor-help"
                title={showTooltips ? "Experience Points - Level up to unlock new features" : undefined}
              >
                <XpIcon className="text-primary" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold leading-none">
                    {gameState.xp}/{gameState.maxXp} xp
                  </span>
                  <Progress value={(gameState.xp / gameState.maxXp) * 100} className="h-0.5 w-12" />
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 text-sm cursor-help"
                title={showTooltips ? "Cash - Used to start tasks and hire researchers" : undefined}
              >
                <CurrencyDollar className="w-5 h-5 text-emerald-400" />
                <span className="font-bold">{gameState.cash.toLocaleString()}</span>
              </div>
              <div
                className="flex items-center gap-1.5 text-sm cursor-help"
                title={showTooltips ? "Research Points - Unlock new technologies" : undefined}
              >
                <Lightning className="w-5 h-5 text-amber-400" />
                <span className="font-bold">{gameState.rp}</span>
              </div>
              <div
                className="flex items-center gap-1.5 text-sm cursor-help"
                title={showTooltips ? "Reputation - Unlock partnerships and advanced features" : undefined}
              >
                <Star className="w-5 h-5 text-blue-400" />
                <span className="font-bold">{gameState.reputation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
