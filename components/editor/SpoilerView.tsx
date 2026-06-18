"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"

export function SpoilerView() {
  const [revealed, setRevealed] = useState(false)

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setRevealed((value) => !value)
  }

  function stopEditorMouseDown(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <NodeViewWrapper>
      <div className="relative my-4 rounded-md border border-dashed border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/20">
        <button
          aria-label={revealed ? "Hide spoiler" : "Show spoiler"}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded bg-yellow-100 text-yellow-800 leading-none transition-opacity hover:opacity-80 dark:bg-yellow-900/40 dark:text-yellow-300 [&_svg]:block"
          contentEditable={false}
          onClick={handleToggle}
          onMouseDown={stopEditorMouseDown}
          type="button"
        >
          {revealed ? (
            <EyeOff aria-hidden="true" className="h-3 w-3" />
          ) : (
            <Eye aria-hidden="true" className="h-3 w-3" />
          )}
        </button>
        <div
          className={[
            "p-4 transition-all",
            revealed ? "" : "pointer-events-none select-none blur-sm",
          ].join(" ")}
        >
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
