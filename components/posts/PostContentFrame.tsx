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
        "rounded-[24px] border border-border-default/80 bg-background/90 p-5 shadow-[0_18px_60px_rgba(31,24,38,0.08)] backdrop-blur-xl dark:bg-background/80 sm:p-8 md:p-10",
        className,
      )}
    >
      {children}
    </div>
  )
}
