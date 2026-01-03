"use client"

import { X, Users } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ClanPanelProps {
  open: boolean
  onClose: () => void
}

export function ClanPanel({ open, onClose }: ClanPanelProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users weight="fill" className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Clans</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X weight="bold" className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4 bg-secondary border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Create New Clan</h3>
            <input
              type="text"
              placeholder="Clan name..."
              className="w-full px-3 py-2 rounded bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground mb-3"
            />
            <Button className="w-full">Create Clan</Button>
          </Card>

          <Card className="p-4 bg-secondary border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Join Existing Clan</h3>
            <input
              type="text"
              placeholder="Search clans..."
              className="w-full px-3 py-2 rounded bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
          </Card>
        </div>
      </div>
    </>
  )
}
