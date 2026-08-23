"use client"

import type { Editor } from "@tiptap/react"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { ChevronDown, ChevronUp, Replace, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface TextMatch {
  from: number
  to: number
}

interface FindDecorationMeta {
  currentIndex: number
  matches: TextMatch[]
}

interface EditorFindReplaceProps {
  editor: Editor
  onOpenChange: (open: boolean) => void
  open: boolean
}

const findReplacePluginKey = new PluginKey<DecorationSet>("editorFindReplace")

export function findTextMatches(editor: Editor, query: string): TextMatch[] {
  const normalizedQuery = query.toLocaleLowerCase()
  if (!normalizedQuery) return []

  const matches: TextMatch[] = []
  editor.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) return

    const normalizedText = node.text.toLocaleLowerCase()
    let index = normalizedText.indexOf(normalizedQuery)
    while (index !== -1) {
      matches.push({
        from: position + index,
        to: position + index + query.length,
      })
      index = normalizedText.indexOf(normalizedQuery, index + query.length)
    }
  })

  return matches
}

export function EditorFindReplace({
  editor,
  onOpenChange,
  open,
}: EditorFindReplaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [, setDocumentRevision] = useState(0)
  const [query, setQuery] = useState("")
  const [replacement, setReplacement] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const matches = findTextMatches(editor, query)
  const safeCurrentIndex = matches.length === 0 ? 0 : currentIndex % matches.length

  useEffect(() => {
    const plugin = new Plugin<DecorationSet>({
      key: findReplacePluginKey,
      props: {
        decorations(state) {
          return findReplacePluginKey.getState(state) ?? DecorationSet.empty
        },
      },
      state: {
        apply(transaction, decorations) {
          const meta = transaction.getMeta(findReplacePluginKey) as
            | FindDecorationMeta
            | undefined
          if (meta) {
            return DecorationSet.create(
              transaction.doc,
              meta.matches.map((match, index) =>
                Decoration.inline(match.from, match.to, {
                  class:
                    index === meta.currentIndex
                      ? "editor-find-match editor-find-match-current"
                      : "editor-find-match",
                }),
              ),
            )
          }
          return transaction.docChanged
            ? decorations.map(transaction.mapping, transaction.doc)
            : decorations
        },
        init: () => DecorationSet.empty,
      },
    })

    editor.registerPlugin(plugin)
    return () => {
      editor.unregisterPlugin(findReplacePluginKey)
    }
  }, [editor])

  useEffect(() => {
    const refresh = () => setDocumentRevision((revision) => revision + 1)
    editor.on("update", refresh)
    return () => {
      editor.off("update", refresh)
    }
  }, [editor])

  useEffect(() => {
    editor.view.dispatch(
      editor.state.tr.setMeta(findReplacePluginKey, {
        currentIndex: safeCurrentIndex,
        matches: open ? matches : [],
      } satisfies FindDecorationMeta),
    )
  }, [editor, matches, open, safeCurrentIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const usesCommandKey = event.ctrlKey || event.metaKey
      if (usesCommandKey && event.key.toLocaleLowerCase() === "f") {
        event.preventDefault()
        onOpenChange(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
        return
      }
      if (open && event.key === "Escape") {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange, open])

  const revealMatch = useCallback(
    (index: number) => {
      if (matches.length === 0) return
      const nextIndex = (index + matches.length) % matches.length
      const match = matches[nextIndex]
      setCurrentIndex(nextIndex)
      editor.commands.setTextSelection(match)
      const domPosition = editor.view.domAtPos(match.from)
      const element =
        domPosition.node instanceof HTMLElement
          ? domPosition.node
          : domPosition.node.parentElement
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    [editor, matches],
  )

  function replaceCurrent() {
    const match = matches[safeCurrentIndex]
    if (!match) return
    editor.view.dispatch(editor.state.tr.insertText(replacement, match.from, match.to))
    searchInputRef.current?.focus()
  }

  function replaceAll() {
    if (matches.length === 0) return
    let transaction = editor.state.tr
    for (const match of [...matches].reverse()) {
      transaction = transaction.insertText(replacement, match.from, match.to)
    }
    editor.view.dispatch(transaction)
    setCurrentIndex(0)
    searchInputRef.current?.focus()
  }

  if (!open) return null

  return (
    <section
      aria-label="Tìm và thay thế"
      className="fixed right-3 top-3 z-[115] w-[calc(100vw-1.5rem)] max-w-[390px] rounded-[16px] border border-border-default/70 bg-background/95 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:right-5 sm:top-5"
      role="search"
    >
      <div className="flex items-center gap-2">
        <Input
          ref={searchInputRef}
          aria-label="Tìm trong bài viết"
          className="h-9 min-w-0 flex-1"
          onChange={(event) => {
            setQuery(event.target.value)
            setCurrentIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              revealMatch(safeCurrentIndex + (event.shiftKey ? -1 : 1))
            }
          }}
          placeholder="Tìm trong bài viết"
          value={query}
        />
        <span
          aria-live="polite"
          className="w-12 shrink-0 text-center text-[11px] tabular-nums text-text-tertiary"
        >
          {matches.length === 0 ? "0 / 0" : `${safeCurrentIndex + 1} / ${matches.length}`}
        </span>
        <Button
          aria-label="Kết quả trước"
          className="h-8 w-8 rounded-full p-0"
          disabled={matches.length === 0}
          onClick={() => revealMatch(safeCurrentIndex - 1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronUp aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Kết quả tiếp theo"
          className="h-8 w-8 rounded-full p-0"
          disabled={matches.length === 0}
          onClick={() => revealMatch(safeCurrentIndex + 1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Đóng tìm và thay thế"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => onOpenChange(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          aria-label="Thay bằng"
          className="h-9 min-w-0 flex-1"
          onChange={(event) => setReplacement(event.target.value)}
          placeholder="Thay bằng"
          value={replacement}
        />
        <Button
          aria-label="Thay kết quả hiện tại"
          className="h-9 px-3"
          disabled={matches.length === 0}
          onClick={replaceCurrent}
          type="button"
          variant="outline"
        >
          <Replace aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Thay</span>
        </Button>
        <Button
          className="h-9 whitespace-nowrap px-3"
          disabled={matches.length === 0}
          onClick={replaceAll}
          type="button"
          variant="outline"
        >
          Thay tất cả
        </Button>
      </div>
    </section>
  )
}
