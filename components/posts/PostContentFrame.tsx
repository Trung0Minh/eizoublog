import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PostContentFrameProps {
  children: ReactNode
  className?: string
}

export function PostContentFrame({
  children,
  className,
}: PostContentFrameProps) {
  return (
    <div
      className={cn(
        "relative z-30 overflow-hidden rounded-[16px] border border-border-default/60 bg-background/90 px-3 py-4 backdrop-blur-sm sm:rounded-[8px] sm:bg-subtle-bg/90 sm:p-8 md:p-12",
        className,
      )}
    >
      <div className="rounded-[14px] border border-transparent">{children}</div>
    </div>
  )
}
