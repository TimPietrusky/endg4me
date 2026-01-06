"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useGameData } from "@/components/providers/game-data-provider"
import { SubNavContainer } from "@/components/game/dashboard/sub-nav"

const LAB_ROUTES = [
  { href: "/lab/upgrades", label: "UPGRADES" },
  { href: "/lab/team", label: "TEAM" },
  { href: "/lab/models", label: "MODELS" },
  { href: "/lab/levels", label: "LEVELS" },
]

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { trainedModels } = useGameData()

  // Count unique blueprints (model families), not total versions
  const uniqueBlueprints = trainedModels 
    ? new Set(trainedModels.map(m => m.blueprintId)).size 
    : 0
  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* SubNav with Links */}
      <SubNavContainer>
        {LAB_ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={`text-xs lowercase pb-2 border-b-2 -mb-[9px] transition-colors ${
              isActive(route.href)
                ? "border-primary text-white font-bold"
                : "border-transparent text-white hover:border-white/30"
            }`}
          >
            <span className="flex items-center">
              {route.label}
              {route.label === "MODELS" && uniqueBlueprints > 0 && (
                <span className="ml-1 text-white/60">({uniqueBlueprints})</span>
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

