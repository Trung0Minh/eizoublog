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
        "rounded-[8px] border border-border-default bg-background px-5 py-6 shadow-sm md:px-8 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  )
}
