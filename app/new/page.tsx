"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { FounderSelection } from "@/components/game/founder-selection"

export default function NewLabPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user ID
  useEffect(() => {
    async function initUser() {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          const data = await res.json()
          setUserId(data.convexUserId)
        }
      } catch (error) {
        console.error("Failed to get user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    initUser()
  }, [])

  // Check if user already has a lab
  const labData = useQuery(
    api.labs.getFullLabData,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )

  // Redirect to operate if lab already exists
  useEffect(() => {
    if (labData?.lab) {
      router.replace("/operate")
    }
  }, [labData, router])

  if (isLoading) {
    return <LoadingScreen message="Connecting..." />
  }

  if (!userId) {
    return <LoadingScreen message="Loading user..." />
  }

  // Still checking for existing lab
  if (labData === undefined) {
    return <LoadingScreen message="Checking lab status..." />
  }

  // User has a lab, redirect is happening
  if (labData?.lab) {
    return <LoadingScreen message="Redirecting..." />
  }

  // No lab - show founder selection
  return <FounderSelection userId={userId} />
}

function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500">{message}</p>
      </div>
    </div>
  )
}

