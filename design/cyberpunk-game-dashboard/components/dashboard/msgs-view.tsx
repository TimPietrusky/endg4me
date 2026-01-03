"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EnvelopeSimple, Trophy, CheckCircle, User } from "@phosphor-icons/react"
import type { Notification } from "@/lib/game-types"

interface MsgsViewProps {
  notifications: Notification[]
}

export function MsgsView({ notifications }: MsgsViewProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "level_up":
        return <Trophy weight="fill" className="w-5 h-5 text-primary" />
      case "message":
        return <User weight="fill" className="w-5 h-5 text-blue-400" />
      case "task_complete":
        return <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" />
      default:
        return <EnvelopeSimple weight="fill" className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  return (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <EnvelopeSimple className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>no messages yet</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
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
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
