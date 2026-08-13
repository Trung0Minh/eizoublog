"use client"

import type { Editor, JSONContent } from "@tiptap/react"
import { ChevronDown, ListTree } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { TableOfContentsHeading } from "@/components/posts/TableOfContentsHeading"
import { extractHeadings, type PostHeading } from "@/lib/postHeadings"

interface EditorTableOfContentsProps {
  className?: string
  collapsible?: boolean
  content: JSONContent
  editor: Editor | null
}

interface PositionedHeading extends PostHeading {
  position: number
}

function getPositionedHeadings(
  editor: Editor,
  headings: PostHeading[],
): PositionedHeading[] {
  const positions: number[] = []

  editor.state.doc.descendants((node, position) => {
    if (node.type.name === "heading" && node.textContent.trim()) {
      positions.push(position + 1)
    }
  })

  return headings.flatMap((heading, index) => {
    const position = positions[index]
    return position === undefined ? [] : [{ ...heading, position }]
  })
}

export function EditorTableOfContents({
  className,
  collapsible = false,
  content,
  editor,
}: EditorTableOfContentsProps) {
  const [, setEditorRevision] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const headings = useMemo(() => extractHeadings(content), [content])
  const positionedHeadings = editor
    ? getPositionedHeadings(editor, headings)
    : []
  const activeId = editor
    ? positionedHeadings.reduce<PositionedHeading | undefined>(
        (current, heading) =>
          heading.position <= editor.state.selection.from ? heading : current,
        undefined,
      )?.id ?? ""
    : ""

  useEffect(() => {
    if (!editor) return

    const refreshOutline = () => setEditorRevision((current) => current + 1)

    editor.on("selectionUpdate", refreshOutline)
    editor.on("update", refreshOutline)

    return () => {
      editor.off("selectionUpdate", refreshOutline)
      editor.off("update", refreshOutline)
    }
  }, [editor])

  const jumpToHeading = useCallback(
    (headingId: string) => {
      if (!editor) return

      const heading = getPositionedHeadings(editor, headings).find(
        ({ id }) => id === headingId,
      )
      if (!heading) return

      editor
        .chain()
        .focus()
        .setTextSelection(heading.position)
        .scrollIntoView()
        .run()
      setIsOpen(false)
    },
    [editor, headings],
  )

  if (headings.length === 0) return null

  const outline = (
    <ol className="relative flex flex-col border-l border-border-default/70 py-1">
      {headings.map(({ id, level, text }) => {
        const isActive = activeId === id

        return (
          <li key={id}>
            <button
              aria-current={isActive ? "location" : "false"}
              className={cn(
                "relative block w-full cursor-pointer text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "font-semibold text-accent"
                  : "text-text-secondary hover:text-text-primary",
                "disabled:cursor-default disabled:opacity-70",
              )}
              disabled={!editor}
              onClick={() => jumpToHeading(id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-px top-1.5 h-[calc(100%-12px)] w-0.5 bg-accent transition-opacity duration-200 motion-reduce:transition-none",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <TableOfContentsHeading
                active={isActive}
                basePadding={12}
                className="w-full"
                level={level}
              >
                <span className="line-clamp-2">{text}</span>
              </TableOfContentsHeading>
            </button>
          </li>
        )
      })}
    </ol>
  )

  if (!collapsible) {
    return (
      <nav
        aria-label="Điều hướng bài viết"
        className={cn("font-sans", className)}
      >
        <div className="mb-3 flex items-center gap-2 text-text-tertiary">
          <ListTree aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="text-[12px] font-bold uppercase tracking-[0.14em]">
            Dàn ý bài viết
          </span>
          <span className="ml-auto text-[10px] tabular-nums">
            {headings.length}
          </span>
        </div>
        {outline}
      </nav>
    )
  }

  return (
    <div
      className={cn(
        "rounded-[10px] border border-border-default/60 bg-background/55 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      <button
        aria-expanded={isOpen}
        aria-label="Mục lục bài viết"
        className="flex w-full cursor-pointer items-center gap-2 text-left text-[13px] font-semibold text-text-primary transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ListTree aria-hidden="true" className="h-4 w-4 text-text-tertiary" />
        <span>Dàn ý bài viết</span>
        <span className="text-[11px] font-normal tabular-nums text-text-tertiary">
          {headings.length} mục
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-auto h-4 w-4 text-text-tertiary transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        aria-hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {isOpen && (
            <div className="mt-3 pr-1">
              {outline}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
