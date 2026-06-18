"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"

export function SpoilerBlock({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="relative my-4 rounded-md border border-dashed border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/20">
      <button
        aria-label={revealed ? "Hide spoiler" : "Show spoiler"}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded bg-yellow-100 p-0 text-yellow-800 leading-none transition-opacity hover:opacity-80 dark:bg-yellow-900/40 dark:text-yellow-300 [&_svg]:block"
        onClick={() => setRevealed((value) => !value)}
        type="button"
      >
        {revealed ? (
          <EyeOff aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Eye aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
      <div
        className={[
          "p-4 transition-all",
          revealed ? "" : "pointer-events-none select-none blur-sm",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  )
}
