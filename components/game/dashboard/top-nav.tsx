"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CurrencyDollar, Lightning, Star, SignOut } from "@phosphor-icons/react"
import { XpIcon } from "./xp-icon"
import type { ViewType } from "@/lib/game-types"

interface TopNavProps {
  labName: string
  founderType: string
  level: number
  xp: number
  maxXp: number
  cash: number
  rp: number
  reputation: number
  modelsTrained: number
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  notificationCount: number
  actionsCount: number
}

export function TopNav({
  labName,
  founderType,
  level,
  xp,
  maxXp,
  cash,
  rp,
  reputation,
  modelsTrained,
  currentView,
  setCurrentView,
  notificationCount,
  actionsCount,
}: TopNavProps) {
  const getFounderBadge = (type: string) => {
    switch (type) {
      case "technical":
        return "TF"
      case "business":
        return "BF"
      case "research":
        return "RF"
      default:
        return "TF"
    }
  }

  return (
    <div className="border-b border-white/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Lab name and navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Star weight="fill" className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{labName}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    {getFounderBadge(founderType)}
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
              {modelsTrained > 0 && (
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
                    {modelsTrained}
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

          {/* Right Side - Stats and Sign out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-xs font-bold text-muted-foreground lowercase">lvl</span>
                <span className="text-base font-bold text-white border border-white px-1.5 rounded">{level}</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <XpIcon className="text-white" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold leading-none">
                    {xp}/{maxXp}
                  </span>
                  <div className="h-0.5 w-12 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${(xp / maxXp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <CurrencyDollar className="w-5 h-5 text-white" />
                <span className="font-bold">{cash.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Lightning className="w-5 h-5 text-white" />
                <span className="font-bold">{rp}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-5 h-5 text-white" />
                <span className="font-bold">{reputation}</span>
              </div>
            </div>

            <a href="/api/auth/signout">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SignOut className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

