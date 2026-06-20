"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSONContent } from "@tiptap/react"

import { cn, generateSlug } from "@/lib/utils"

interface Heading {
  id: string
  level: number
  text: string
}

function getText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  return node.content?.map(getText).join("") ?? ""
}

export function extractHeadings(content: JSONContent): Heading[] {
  const headings: Heading[] = []

  function walk(node: JSONContent) {
    if (node.type === "heading") {
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2
      const text = getText(node).trim()

      if (text) {
        headings.push({ id: generateSlug(text), level, text })
      }
    }

    node.content?.forEach(walk)
  }

  walk(content)
  return headings
}

interface TableOfContentsProps {
  content: JSONContent
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("")
  const headings = useMemo(() => extractHeadings(content), [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0% -60% 0%" },
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)

      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  return (
    <nav className="sticky top-[80px] font-sans" aria-label="Mục lục">
      <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
        Nội dung
      </h4>
      <ul className="flex flex-col relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border-default"></div>
        {headings.map(({ id, level, text }) => (
          <li
            key={id}
          >
            <a
              className={cn(
                "py-1.5 text-[13px] relative flex items-center transition-colors",
                activeId === id
                  ? "font-semibold text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              style={{ paddingLeft: `${Math.max(0, level - 2) * 12 + 8}px` }}
              href={`#${id}`}
            >
              {activeId === id && (
                <div className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-accent"></div>
              )}
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
