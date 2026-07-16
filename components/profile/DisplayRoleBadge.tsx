import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"
import {
  DEFAULT_DISPLAY_ROLE_COLOR,
  DEFAULT_DISPLAY_ROLE_NAME,
  getDisplayRolePalette,
} from "@/lib/displayRole"

interface DisplayRoleBadgeProps {
  className?: string
  displayRoleColor: string | null
  displayRoleName: string | null
}

export const ROLE_BADGE_CLASS_NAME =
  "inline-flex shrink-0 items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"

export function DisplayRoleBadge({
  className,
  displayRoleColor,
  displayRoleName,
}: DisplayRoleBadgeProps) {
  const hasCustomRole = Boolean(displayRoleColor && displayRoleName)
  const color = hasCustomRole
    ? displayRoleColor ?? DEFAULT_DISPLAY_ROLE_COLOR
    : DEFAULT_DISPLAY_ROLE_COLOR
  const name = hasCustomRole
    ? displayRoleName ?? DEFAULT_DISPLAY_ROLE_NAME
    : DEFAULT_DISPLAY_ROLE_NAME
  const palette = getDisplayRolePalette(color)
  const style = {
    "--display-role-bg": palette.lightBackground,
    "--display-role-bg-dark": palette.darkBackground,
    "--display-role-fg": palette.lightForeground,
    "--display-role-fg-dark": palette.darkForeground,
  } as CSSProperties

  return (
    <span
      className={cn(
        ROLE_BADGE_CLASS_NAME,
        "display-role-badge",
        className,
      )}
      style={style}
      title={`Display role: ${name}`}
    >
      {name}
    </span>
  )
}
