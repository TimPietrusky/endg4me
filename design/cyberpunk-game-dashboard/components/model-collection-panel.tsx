"use client"

import { X, Brain, Trophy, ChartLine, Target, Medal } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ModelCollectionPanelProps {
  open: boolean
  onClose: () => void
  modelsTrained: number
  bestScore: number
}

export function ModelCollectionPanel({ open, onClose, modelsTrained, bestScore }: ModelCollectionPanelProps) {
  if (!open) return null

  const models = [
    { id: "1", name: "Train-Small #1", type: "Small", score: 265, date: "Jan 02, 2026", isBest: true },
    { id: "2", name: "Train-Small #2", type: "Small", score: 243, date: "Jan 02, 2026", isBest: false },
    { id: "3", name: "Train-Medium #1", type: "Medium", score: 210, date: "Jan 02, 2026", isBest: false },
  ]

  const totalScore = models.reduce((acc, m) => acc + m.score, 0)
  const avgScore = Math.round(totalScore / models.length)

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-card border-l border-border z-50 overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain weight="fill" className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Model Collection</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X weight="bold" className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-secondary border-border">
              <div className="flex items-center gap-2 mb-1">
                <ChartLine weight="fill" className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Models</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{modelsTrained}</p>
            </Card>

            <Card className="p-4 bg-secondary border-border">
              <div className="flex items-center gap-2 mb-1">
                <Trophy weight="fill" className="w-4 h-4 text-warning" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Score</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalScore}</p>
            </Card>

            <Card className="p-4 bg-secondary border-border">
              <div className="flex items-center gap-2 mb-1">
                <Target weight="fill" className="w-4 h-4 text-accent" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg. Score</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{avgScore}</p>
            </Card>

            <Card className="p-4 bg-secondary border-border bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="flex items-center gap-2 mb-1">
                <Medal weight="fill" className="w-4 h-4 text-success" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Best Model</p>
              </div>
              <p className="text-2xl font-bold text-success tabular-nums">{bestScore}</p>
            </Card>
          </div>

          <div className="space-y-2">
            {models.map((model) => (
              <Card key={model.id} className="p-4 bg-secondary border-border relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain weight="fill" className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">{model.name}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {model.type}
                      </span>
                      {model.isBest && <Medal weight="fill" className="w-4 h-4 text-success" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-primary font-semibold tabular-nums">{model.score} RP</span>
                      <span>Trained on {model.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
