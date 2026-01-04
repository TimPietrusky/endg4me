"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGameData } from "@/components/providers/game-data-provider"
import { MsgsView, type InboxFilter } from "@/components/game/dashboard/msgs-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import type { ViewType } from "@/lib/game-types"

export default function InboxPage() {
  const router = useRouter()
  const { notifications, unreadCount, handleMarkAsRead } = useGameData()
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all")

  const handleNavigate = (view: ViewType, target?: string) => {
    // Navigate to the view route
    router.push(`/${view}`)
  }

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={inboxFilter === "unread"}
          onClick={() => setInboxFilter(
            inboxFilter === "unread" ? "all" : "unread"
          )}
          badge={unreadCount}
        >
          UNREAD
        </SubNavButton>
      </SubNavContainer>

      {/* Main content */}
      <MsgsView
        notifications={notifications}
        filter={inboxFilter}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={handleNavigate}
      />
    </>
  )
}

