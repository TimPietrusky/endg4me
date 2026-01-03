"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CurrencyDollar, Lightning, Cpu } from "@phosphor-icons/react"
import { SettingsPanel } from "../settings-panel"
import { XpIcon } from "./xp-icon"
import { Logo } from "@/components/logo"
import type { ViewType } from "@/lib/game-types"
import { formatCompact } from "@/lib/utils"

interface TopNavProps {
  labName: string
  founderName: string
  founderType: string
  level: number
  xp: number
  maxXp: number
  cash: number
  rp: number
  gpus: number
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  notificationCount: number
}

export function TopNav({
  labName,
  founderName,
  founderType,
  level,
  xp,
  maxXp,
  cash,
  rp,
  gpus,
  currentView,
  setCurrentView,
  notificationCount,
}: TopNavProps) {
  // Navigation items in order: operate, research, lab, inbox, world
  // Only inbox shows badge count - other counts were noise
  const navItems: { id: ViewType; label: string; badge?: number | string }[] = [
    { id: "operate", label: "operate" },
    { id: "research", label: "research" },
    { id: "lab", label: "lab" },
    { id: "inbox", label: "inbox", badge: notificationCount > 0 ? `${notificationCount}` : undefined },
    { id: "world", label: "world" },
  ]

  return (
    <div className="border-b border-white/20 bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Game logo and navigation */}
          <div className="flex items-center gap-6">
            <Logo className="h-5 w-auto text-white" />

            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView(item.id)}
                  className={`text-xs h-8 lowercase transition-all hover:!bg-white hover:!text-black ${
                    currentView === item.id
                      ? "bg-white text-black font-bold"
                      : ""
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Side - Stats and Sign out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView("lab")}
                className={`flex items-center gap-1.5 text-sm hover:bg-white/10 px-2 py-1 rounded transition-colors ${
                  currentView === "lab" ? "bg-white/10" : ""
                }`}
                title="View milestones"
              >
                <span className="text-xs font-bold text-muted-foreground lowercase">lvl</span>
                <span className="text-base font-bold text-white border border-white px-1.5 rounded">{level}</span>
              </button>

              <div className="flex items-center gap-1.5 text-sm">
                <XpIcon className="text-white" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold leading-none">
                    {xp}/{maxXp}
                  </span>
                  <div className="h-0.5 w-12 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${Math.min((xp / maxXp) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <CurrencyDollar className="w-5 h-5 text-white" />
                <span className="font-bold">{formatCompact(cash)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Lightning className="w-5 h-5 text-white" />
                <span className="font-bold">{formatCompact(rp)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Cpu className="w-5 h-5 text-white" />
                <span className="font-bold">{gpus}</span>
              </div>
            </div>

            <SettingsPanel
              labName={labName}
              founderName={founderName}
              founderType={founderType}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

