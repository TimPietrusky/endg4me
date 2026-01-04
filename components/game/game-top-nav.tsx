"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { CurrencyDollar, Lightning, Cpu } from "@phosphor-icons/react"
import { SettingsPanel } from "./settings-panel"
import { LevelProgress } from "./dashboard/level-progress"
import { Logo } from "@/components/logo"
import type { ViewType } from "@/lib/game-types"
import { formatCompact } from "@/lib/utils"

interface GameTopNavProps {
  labName: string
  founderName: string
  founderType: string
  level: number
  xp: number
  maxXp: number
  cash: number
  rp: number
  gpus: number
  notificationCount: number
}

export function GameTopNav({
  labName,
  founderName,
  founderType,
  level,
  xp,
  maxXp,
  cash,
  rp,
  gpus,
  notificationCount,
}: GameTopNavProps) {
  const pathname = usePathname()
  
  // Derive current view from pathname
  const getCurrentView = (): ViewType | null => {
    if (pathname === "/operate") return "operate"
    if (pathname === "/research") return "research"
    if (pathname === "/lab") return "lab"
    if (pathname === "/inbox") return "inbox"
    if (pathname === "/world") return "world"
    if (pathname === "/level") return "level"
    return null // No nav item active for unknown routes
  }
  
  const currentView = getCurrentView()

  // Navigation items
  const navItems: { id: ViewType; label: string; href: string; badge?: number | string }[] = [
    { id: "operate", label: "operate", href: "/operate" },
    { id: "research", label: "research", href: "/research" },
    { id: "lab", label: "lab", href: "/lab" },
    { id: "inbox", label: "inbox", href: "/inbox", badge: notificationCount > 0 ? `${notificationCount}` : undefined },
    { id: "world", label: "world", href: "/world" },
  ]

  return (
    <div className="border-b border-white/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Game logo and navigation */}
          <div className="flex items-center gap-6">
            <Link href="/?from=game">
              <Logo className="h-5 w-auto text-white" />
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`inline-flex items-center justify-center text-xs h-8 px-3 rounded-md lowercase transition-all ${
                    currentView === item.id
                      ? "bg-white text-black font-bold hover:bg-white/80"
                      : "hover:bg-white/20 hover:text-white text-white/70"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side - Stats and Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <LevelProgress
                level={level}
                xp={xp}
                maxXp={maxXp}
                isActive={currentView === "level"}
              />

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

