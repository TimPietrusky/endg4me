"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useGameData } from "@/components/providers/game-data-provider"
import { LabOverviewHeader } from "@/components/game/dashboard/lab-overview-header"
import { SubNavContainer } from "@/components/game/dashboard/sub-nav"

const LAB_ROUTES = [
  { href: "/lab/upgrades", label: "UPGRADES" },
  { href: "/lab/team", label: "TEAM" },
  { href: "/lab/models", label: "MODELS" },
  { href: "/lab/levels", label: "LEVELS" },
]

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { 
    user,
    lab, 
    labState,
    trainedModels, 
    publicModelCount,
    staffCapacity,
  } = useGameData()

  if (!lab || !labState || !user) {
    return null
  }

  const totalModels = trainedModels?.length || 0

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Lab Overview Header - org card style */}
      <LabOverviewHeader
        labName={lab.name}
        founderType={lab.founderType}
        totalModels={totalModels}
        publicModelsCount={publicModelCount}
        staffCount={labState.juniorResearchers}
        staffCapacity={staffCapacity}
      />

      {/* SubNav with Links */}
      <SubNavContainer>
        {LAB_ROUTES.map((route, index) => (
          <Link
            key={route.href}
            href={route.href}
            className={`text-xs lowercase pb-2 border-b-2 -mb-[9px] transition-colors ${
              isActive(route.href)
                ? "border-primary text-white font-bold"
                : "border-transparent text-white hover:border-white/30"
            } ${index === 0 ? "" : ""}`}
          >
            <span className="flex items-center">
              {route.label}
              {route.label === "MODELS" && totalModels > 0 && (
                <span className="ml-1 text-white/60">({totalModels})</span>
              )}
            </span>
          </Link>
        ))}
      </SubNavContainer>

      {/* Page content */}
      {children}
    </>
  )
}

