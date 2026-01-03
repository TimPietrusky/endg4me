"use client"

import { Brain, CaretRight } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"

interface ModelCollectionButtonProps {
  count: number
  bestScore: number
  onClick: () => void
}

export function ModelCollectionButton({ count, bestScore, onClick }: ModelCollectionButtonProps) {
  return (
    <Card
      className="p-4 bg-card border-border cursor-pointer hover:bg-secondary/50 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain weight="fill" className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Model Collection</h3>
            <p className="text-xs text-muted-foreground">
              {count} model{count !== 1 ? "s" : ""} trained · Best score: {bestScore}
            </p>
          </div>
        </div>
        <CaretRight
          weight="bold"
          className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
        />
      </div>
    </Card>
  )
}
