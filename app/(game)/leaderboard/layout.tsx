"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Trophy, Ranking } from "@phosphor-icons/react"
import { SubNavContainer, SubNavButton } from "@/components/game/dashboard/sub-nav"

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isModels = pathname.includes("/leaderboard/models")
  const isLabs = pathname === "/leaderboard" || pathname === "/leaderboard/labs"

  return (
    <>
      <SubNavContainer>
        <Link href="/leaderboard/labs">
          <SubNavButton isFirst isActive={isLabs}>
            <Trophy className="w-4 h-4 mr-1" />
            LABS
          </SubNavButton>
        </Link>
        <Link href="/leaderboard/models">
          <SubNavButton isActive={isModels}>
            <Ranking className="w-4 h-4 mr-1" />
            MODELS
          </SubNavButton>
        </Link>
      </SubNavContainer>
      {children}
    </>
  )
}

