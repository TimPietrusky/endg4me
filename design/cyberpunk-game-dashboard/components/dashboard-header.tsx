"use client"

import { Brain, Bell, Users, SignOut } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  labName: string
  founderType: string
  notificationCount: number
  playerLevel: number
  onNotificationClick: () => void
  onClansClick: () => void
  onSignOut: () => void
}

export function DashboardHeader({
  labName,
  founderType,
  notificationCount,
  playerLevel,
  onNotificationClick,
  onClansClick,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain weight="fill" className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-foreground">{labName}</h1>
            <Badge variant="secondary" className="text-xs">
              {founderType}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative" onClick={onNotificationClick}>
            <Bell weight="fill" className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Button>

          {playerLevel >= 3 && (
            <Button variant="ghost" size="sm" onClick={onClansClick}>
              <Users weight="fill" className="w-5 h-5" />
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <SignOut weight="bold" className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
