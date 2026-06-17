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

  function stopEditorMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <NodeViewWrapper>
      <div className="relative my-4 rounded-md border border-dashed border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/20">
        <button
          className="absolute right-2 top-2 z-10 flex min-h-9 items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 transition-opacity hover:opacity-80 dark:bg-yellow-900/40 dark:text-yellow-300"
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
          {revealed ? "Hide spoiler" : "Show spoiler"}
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
