"use client"

import { useState } from "react"
import { useGameData } from "@/components/providers/game-data-provider"
import { MsgsView, type InboxFilter } from "@/components/game/dashboard/msgs-view"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

export default function InboxPage() {
  const { notifications, unreadCount, handleMarkAsRead } = useGameData()
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all")

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
      />
    </>
  )
}
