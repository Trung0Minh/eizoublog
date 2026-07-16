import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"
import { cn } from "@/lib/utils"

interface RoleBadgesProps {
  badgeClassName?: string
  className?: string
  displayRoleColor: string | null
  displayRoleName: string | null
  role: string
}

export function RoleBadges({
  badgeClassName,
  className,
  displayRoleColor,
  displayRoleName,
  role,
}: RoleBadgesProps) {
  if (role !== "ADMIN" && role !== "WRITER") {
    return null
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {role === "ADMIN" && (
        <span
          className={cn(
            "rounded-[4px] bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400",
            badgeClassName,
          )}
          title="System role: Admin"
        >
          ADMIN
        </span>
      )}
      {role === "WRITER" && (
        <DisplayRoleBadge
          className={badgeClassName}
          displayRoleColor={displayRoleColor}
          displayRoleName={displayRoleName}
        />
      )}
      {role === "ADMIN" && displayRoleColor && displayRoleName && (
        <DisplayRoleBadge
          className={badgeClassName}
          displayRoleColor={displayRoleColor}
          displayRoleName={displayRoleName}
        />
      )}
    </span>
  )
}
