"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"
import { ActionCard } from "@/components/game/dashboard/action-card"
import {
  MODEL_BLUEPRINTS,
  JOB_DEFS,
  getAssetBySlug,
} from "@/convex/lib/contentCatalog"
import type { Action } from "@/lib/game-types"

type AssetCategory = "training" | "revenue" | "all"

export default function AdminAssetsPage() {
  const { userId } = useGameData()
  const isAdmin = useQuery(api.dev.checkIsAdmin, userId ? { userId: userId as Id<"users"> } : "skip")
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>("all")

  // If not admin, show access denied
  if (isAdmin === false) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-white/60 mt-2">You need admin privileges to view this page.</p>
      </div>
    )
  }

  // Loading state
  if (isAdmin === undefined) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/60">Checking permissions...</p>
      </div>
    )
  }

  // Get training jobs (models)
  const trainingJobs = JOB_DEFS.filter((j) => j.category === "training")
  const revenueJobs = JOB_DEFS.filter((j) => j.category === "revenue")

  // Convert jobs to Action format for ActionCard
  // Admin view: show all cards as enabled (preview mode)
  const trainingActions: Action[] = trainingJobs.map((job) => {
    const blueprint = MODEL_BLUEPRINTS.find((bp) => bp.trainingJobId === job.jobId)
    const asset = blueprint?.assetSlug ? getAssetBySlug(blueprint.assetSlug) : undefined
    
    // Extract size from name (e.g., "3B TTS" -> "3B")
    const sizeMatch = blueprint?.name.match(/^(\d+B)/)
    const size = sizeMatch ? sizeMatch[1] : undefined

    return {
      id: job.jobId,
      category: "TRAINING",
      name: blueprint?.name.replace(/^\d+B\s*/, "") || job.name, // Remove size prefix from name
      description: job.description,
      size,
      cost: job.moneyCost,
      duration: Math.floor(job.durationMs / 1000), // Convert ms to seconds
      rpReward: job.rewards.rp,
      xpReward: job.rewards.xp,
      gpuCost: job.computeRequiredCU,
      image: asset?.files.image || undefined,
      disabled: false, // Admin preview - show enabled
    }
  })

  const revenueActions: Action[] = revenueJobs.map((job) => {
    return {
      id: job.jobId,
      category: "INCOME",
      name: job.name,
      description: job.description,
      cost: job.moneyCost,
      duration: Math.floor(job.durationMs / 1000), // Convert ms to seconds
      cashReward: job.rewards.money,
      xpReward: job.rewards.xp,
      gpuCost: job.computeRequiredCU,
      disabled: false, // Admin preview - show enabled
    }
  })

  // Filter based on selected category
  const displayTraining = selectedCategory === "all" || selectedCategory === "training"
  const displayRevenue = selectedCategory === "all" || selectedCategory === "revenue"

  // No-op handler for admin view (cards are display-only)
  const handleStartAction = () => {}

  return (
    <>
      {/* SubNav */}
      <SubNavContainer>
        <SubNavButton
          isFirst
          isActive={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
        >
          ALL
        </SubNavButton>
        <SubNavButton
          isActive={selectedCategory === "training"}
          onClick={() => setSelectedCategory("training")}
          badge={trainingActions.length}
        >
          TRAINING
        </SubNavButton>
        <SubNavButton
          isActive={selectedCategory === "revenue"}
          onClick={() => setSelectedCategory("revenue")}
          badge={revenueActions.length}
        >
          REVENUE
        </SubNavButton>
      </SubNavContainer>

      {/* Content */}
      <div className="p-6 space-y-8">
        {displayTraining && (
          <section>
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-white/80">
              Training Models ({trainingActions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {trainingActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onStartAction={handleStartAction}
                />
              ))}
            </div>
          </section>
        )}

        {displayRevenue && (
          <section>
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-white/80">
              Revenue Jobs ({revenueActions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {revenueActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onStartAction={handleStartAction}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
