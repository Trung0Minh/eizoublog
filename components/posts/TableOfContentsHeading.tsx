import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function getTocHeadingPadding(level: number, basePadding = 8) {
  if (level <= 2) return basePadding
  return basePadding + (Math.min(level, 6) - 3) * 20
}

export function TableOfContentsHeading({
  active,
  basePadding = 8,
  children,
  className,
  level,
  style,
}: {
  active: boolean
  basePadding?: number
  children: ReactNode
  className?: string
  level: number
  style?: CSSProperties
}) {
  return (
    <span
      className={cn(
        "group relative min-h-7 items-start rounded-r-md py-1.5 pr-1.5 text-[13px] leading-snug transition-colors",
        level <= 2
          ? "block font-semibold"
          : "grid grid-cols-[14px_minmax(0,1fr)] gap-1.5 font-normal",
        className,
      )}
      data-toc-heading-level={level}
      style={{ paddingLeft: getTocHeadingPadding(level, basePadding), ...style }}
    >
      {level >= 3 && (
        <span
          aria-hidden="true"
          className="flex h-[17px] translate-y-px shrink-0 items-center"
          data-heading-marker-align="first-line"
        >
          <span
            className={cn(
              "block h-[5px] w-[5px] shrink-0 transition-[color,opacity]",
              level === 3
                ? "rounded-full bg-text-secondary opacity-55 group-hover:opacity-100"
                : "border border-accent/45 bg-transparent group-hover:border-accent",
              active && (level >= 4 ? "border-accent" : "bg-accent opacity-100"),
            )}
            data-heading-marker={level === 3 ? "dot" : "hollow-square"}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
