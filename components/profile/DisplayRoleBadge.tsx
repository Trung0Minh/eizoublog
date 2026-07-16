import { cn } from "@/lib/utils"
import {
  DEFAULT_DISPLAY_ROLE_COLOR,
  DEFAULT_DISPLAY_ROLE_NAME,
  getDisplayRoleForeground,
} from "@/lib/displayRole"

interface DisplayRoleBadgeProps {
  className?: string
  displayRoleColor: string | null
  displayRoleName: string | null
}

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

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-sm",
        className,
      )}
      style={{
        backgroundColor: color,
        color: getDisplayRoleForeground(color),
      }}
      title={`Display role: ${name}`}
    >
      {name}
    </span>
  )
}
