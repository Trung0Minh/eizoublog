"use client"

import { Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react"

const DEFAULT_HIDE_LABEL = "Hide spoiler"
const DEFAULT_SHOW_LABEL = "Show spoiler"

function getLabel(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback
}

export function SpoilerView({ node, updateAttributes }: Partial<NodeViewProps>) {
  const [revealed, setRevealed] = useState(false)
  const [hideLabel, setHideLabel] = useState(() =>
    getLabel(node?.attrs.hideLabel, DEFAULT_HIDE_LABEL),
  )
  const [showLabel, setShowLabel] = useState(() =>
    getLabel(node?.attrs.showLabel, DEFAULT_SHOW_LABEL),
  )

  useEffect(() => {
    setHideLabel(getLabel(node?.attrs.hideLabel, DEFAULT_HIDE_LABEL))
    setShowLabel(getLabel(node?.attrs.showLabel, DEFAULT_SHOW_LABEL))
  }, [node?.attrs.hideLabel, node?.attrs.showLabel])

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setRevealed((value) => !value)
  }

  function stopEditorMouseDown(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  function stopEditorEvent(
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) {
    event.stopPropagation()
  }

  function updateShowLabel(value: string) {
    setShowLabel(value)
    updateAttributes?.({
      hideLabel,
      showLabel: value,
    })
  }

  function updateHideLabel(value: string) {
    setHideLabel(value)
    updateAttributes?.({
      hideLabel: value,
      showLabel,
    })
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
          {revealed ? getLabel(hideLabel, DEFAULT_HIDE_LABEL) : getLabel(showLabel, DEFAULT_SHOW_LABEL)}
        </button>
        <div
          className="flex flex-wrap gap-2 border-b border-dashed border-yellow-500/30 bg-yellow-50/60 p-2 pr-28 text-xs dark:bg-yellow-950/20"
          contentEditable={false}
          onClick={stopEditorEvent}
          onKeyDown={stopEditorEvent}
          onMouseDown={stopEditorMouseDown}
        >
          <label className="flex min-w-[150px] flex-1 items-center gap-1.5 text-yellow-900 dark:text-yellow-200">
            <span className="shrink-0">Show</span>
            <input
              aria-label="Show spoiler label"
              className="h-7 min-w-0 flex-1 rounded border border-yellow-500/30 bg-background px-2 text-xs text-text-primary outline-none focus:border-accent"
              onChange={(event) => updateShowLabel(event.target.value)}
              value={showLabel}
            />
          </label>
          <label className="flex min-w-[150px] flex-1 items-center gap-1.5 text-yellow-900 dark:text-yellow-200">
            <span className="shrink-0">Hide</span>
            <input
              aria-label="Hide spoiler label"
              className="h-7 min-w-0 flex-1 rounded border border-yellow-500/30 bg-background px-2 text-xs text-text-primary outline-none focus:border-accent"
              onChange={(event) => updateHideLabel(event.target.value)}
              value={hideLabel}
            />
          </label>
        </div>
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
