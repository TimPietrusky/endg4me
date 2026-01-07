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

// Sub-sub-nav: secondary row below main sub-nav for filters
interface SubSubNavProps {
  children: ReactNode
  className?: string
}

export function SubSubNav({ children, className = "" }: SubSubNavProps) {
  return (
    <div className={`flex items-center gap-4 pt-2 pb-6 text-xs ${className}`}>
      {children}
    </div>
  )
}

// Clickable filter button for SubSubNav (same pattern as SubNavButton)
interface SubSubNavFilterProps {
  label: string
  count: number
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function SubSubNavFilter({ label, count, isActive, onClick, className = "" }: SubSubNavFilterProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center text-xs lowercase px-2 py-1 rounded transition-all cursor-pointer ${
        isActive
          ? "text-white font-bold bg-white/15"
          : "text-white/60 hover:text-white hover:bg-white/5"
      } ${className}`}
    >
      <span>{label}</span>
      <span className="ml-1">({count})</span>
    </button>
  )
}

// Stat item for SubSubNav (non-clickable version)
interface SubSubNavStatProps {
  value: number
  label: string
  className?: string
}

export function SubSubNavStat({ value, label, className = "" }: SubSubNavStatProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-white font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}