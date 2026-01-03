"use client"

import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

// Reusable badge component for SubNav items
interface SubNavBadgeProps {
  count: string | number
  className?: string
}

export function SubNavBadge({ count, className = "" }: SubNavBadgeProps) {
  return (
    <Badge variant="secondary" className={`h-4 px-0 ml-1 overflow-visible ${className}`}>
      ({count})
    </Badge>
  )
}

export interface SubNavItem {
  id: string
  label: string
  badge?: string | number
  isActive?: boolean
  disabled?: boolean
}

interface SubNavProps {
  items: SubNavItem[]
  onItemClick: (id: string) => void
  className?: string
}

export function SubNav({ items, onItemClick, className = "" }: SubNavProps) {
  return (
    <div
      className={`flex items-center gap-4 flex-wrap pt-3 pb-2 border-b border-white/20 ${className}`}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          disabled={item.disabled}
          className={`text-xs lowercase pb-2 border-b-2 -mb-[9px] transition-colors ${
            item.isActive
              ? "border-primary text-white font-bold"
              : "border-transparent text-white hover:border-white/30"
          } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="flex items-center">
            {item.label}
            {item.badge !== undefined && <SubNavBadge count={item.badge} />}
          </span>
        </button>
      ))}
    </div>
  )
}

// Flexible version that accepts children for custom content
interface SubNavContainerProps {
  children: ReactNode
  className?: string
}

export function SubNavContainer({ children, className = "" }: SubNavContainerProps) {
  return (
    <div
      className={`flex items-center gap-4 flex-wrap pt-3 pb-2 border-b border-white/20 ${className}`}
    >
      {children}
    </div>
  )
}

// Individual item for use with SubNavContainer
interface SubNavButtonProps {
  isActive?: boolean
  isFirst?: boolean
  disabled?: boolean
  badge?: string | number
  onClick?: () => void
  children: ReactNode
}

export function SubNavButton({
  isActive,
  isFirst,
  disabled,
  badge,
  onClick,
  children,
}: SubNavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs lowercase pb-2 border-b-2 -mb-[9px] transition-colors ${
        isActive
          ? "border-primary text-white font-bold"
          : "border-transparent text-white hover:border-white/30"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="flex items-center">
        {children}
        {badge !== undefined && <SubNavBadge count={badge} />}
      </span>
    </button>
  )
}
