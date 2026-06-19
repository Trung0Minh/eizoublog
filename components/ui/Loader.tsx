import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"

const sizeClass: Record<LoaderSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

interface LoaderProps extends ComponentPropsWithoutRef<"svg"> {
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
    <svg
      aria-label={label}
      className={cn("animate-spin text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]", sizeClass[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      {...props}
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      ></circle>
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}
