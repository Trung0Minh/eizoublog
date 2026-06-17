import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"

const sizeClass: Record<LoaderSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

interface LoaderProps extends ComponentPropsWithoutRef<"span"> {
  className?: string
  label?: string
  size?: LoaderSize
}

export function Loader({
  className,
  label = "Loading",
  size = "lg",
  ...props
}: LoaderProps) {
  return (
    <span
      aria-label={label}
      className={cn("loader text-text-primary", sizeClass[size], className)}
      role="status"
      {...props}
    />
  )
}
