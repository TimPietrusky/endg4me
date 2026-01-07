"use client"

import type { ReactNode } from "react"
import { TopNav } from "./top-nav"
import type { ViewType } from "@/lib/game-types"

interface PageHeaderProps {
  // TopNav props
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
  // SubNav content (optional)
  subNav?: ReactNode
}

export function PageHeader({
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
  subNav,
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-50">
      <TopNav
        labName={labName}
        founderName={founderName}
        founderType={founderType}
        level={level}
        xp={xp}
        maxXp={maxXp}
        cash={cash}
        rp={rp}
        gpus={gpus}
        currentView={currentView}
        setCurrentView={setCurrentView}
        notificationCount={notificationCount}
      />
      {subNav && (
        <div className="px-6 bg-background">
          {subNav}
        </div>
      )}
    </div>
  )
}





