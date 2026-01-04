"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EnvelopeSimple, Trophy, CheckCircle, User, Star, UserPlus, Lightning, ArrowRight } from "@phosphor-icons/react"
import type { Notification, ViewType } from "@/lib/game-types"

export type InboxFilter = "all" | "unread"

interface MsgsViewProps {
  notifications: Notification[]
  filter: InboxFilter
  onMarkAsRead?: (id: string | number) => void
}

// Build URL from deepLink data
function getDeepLinkUrl(view: ViewType, target?: string): string {
  if (view === "lab" && target) {
    return `/lab/${target}`
  }
  return `/${view}`
}

export function MsgsView({ notifications, filter, onMarkAsRead }: MsgsViewProps) {
  const router = useRouter()

  // Filter notifications based on read status
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return true
  })

  const getIcon = (type: string) => {
    switch (type) {
      case "level_up":
        return <Trophy weight="fill" className="w-5 h-5 text-primary" />
      case "message":
        return <User weight="fill" className="w-5 h-5 text-blue-400" />
      case "task_complete":
        return <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" />
      case "unlock":
        return <Star weight="fill" className="w-5 h-5 text-amber-400" />
      case "hire_complete":
        return <UserPlus weight="fill" className="w-5 h-5 text-violet-400" />
      case "research_complete":
        return <Lightning weight="fill" className="w-5 h-5 text-purple-400" />
      default:
        return <EnvelopeSimple weight="fill" className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const getDeepLinkLabel = (view: ViewType) => {
    switch (view) {
      case "operate":
        return "Go to Operate"
      case "research":
        return "Go to Research"
      case "lab":
        return "View in Lab"
      case "world":
        return "View in World"
      default:
        return "View"
    }
  }

  const handleClick = (notification: Notification) => {
    onMarkAsRead?.(notification.id)
    if (notification.deepLink) {
      const url = getDeepLinkUrl(notification.deepLink.view, notification.deepLink.target)
      router.push(url)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <EnvelopeSimple className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{filter === "unread" ? "no unread messages" : "no messages yet"}</p>
          </CardContent>
        </Card>
      ) : (
        filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className="hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => handleClick(notification)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white truncate">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                {notification.deepLink && (
                  <Link
                    href={getDeepLinkUrl(notification.deepLink.view, notification.deepLink.target)}
                    className="inline-flex items-center text-xs h-6 mt-2 text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsRead?.(notification.id)
                    }}
                  >
                    {getDeepLinkLabel(notification.deepLink.view)}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
