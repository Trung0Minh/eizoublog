"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSONContent } from "@tiptap/react"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { extractHeadings } from "@/lib/postHeadings"

interface TableOfContentsProps {
  content: JSONContent
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("")
  const headings = useMemo(() => extractHeadings(content), [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const topmostEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          )[0]

        if (topmostEntry) {
          setActiveId(topmostEntry.target.id)
        }
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
                <motion.div 
                  layoutId="toc-indicator" 
                  className="absolute left-[0px] top-0 bottom-0 w-[2px] bg-accent shadow-[0_0_8px_var(--accent)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
