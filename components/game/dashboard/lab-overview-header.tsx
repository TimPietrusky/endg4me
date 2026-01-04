"use client"

import { 
  Buildings, 
  Brain,
  GlobeHemisphereWest,
  Users
} from "@phosphor-icons/react"

interface LabOverviewHeaderProps {
  labName: string
  founderType: "technical" | "business"
  totalModels: number
  publicModelsCount: number
  staffCount: number
  staffCapacity: number
}

export function LabOverviewHeader({
  labName,
  founderType,
  totalModels,
  publicModelsCount,
  staffCount,
  staffCapacity,
}: LabOverviewHeaderProps) {
  return (
    <div className="mb-4 p-4 bg-card/50 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-4">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-lg flex items-center justify-center">
            <Buildings className="w-7 h-7 text-white" weight="bold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{labName}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {founderType} lab
            </p>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="flex items-center gap-6">
          {/* Models */}
          <div className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold">{totalModels}</span>
            <span className="text-muted-foreground">models</span>
          </div>

          {/* Public */}
          <div className="flex items-center gap-2 text-sm">
            <GlobeHemisphereWest className="w-4 h-4 text-green-400" />
            <span className="font-bold">{publicModelsCount}</span>
            <span className="text-muted-foreground">public</span>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold">{staffCount}/{staffCapacity}</span>
            <span className="text-muted-foreground">staff</span>
          </div>
        </div>
      </div>
    </div>
  )
}

