"use client"

import { X, Bell } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  if (!open) return null

  const notifications = [
    { id: "1", title: "Training Complete", message: "Your medium model training is done!", timestamp: "2m ago" },
    { id: "2", title: "Level Up!", message: "You reached level 2", timestamp: "5m ago" },
    { id: "3", title: "New Achievement", message: "First model trained", timestamp: "10m ago" },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell weight="fill" className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Notifications</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X weight="bold" className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-4 rounded bg-secondary border border-border">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                <span className="text-xs text-muted-foreground">{notif.timestamp}</span>
              </div>
              <p className="text-sm text-muted-foreground">{notif.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
