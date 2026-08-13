"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSONContent } from "@tiptap/react"
import { ChevronDown } from "lucide-react"

import { motion } from "motion/react"

import { TableOfContentsHeading } from "@/components/posts/TableOfContentsHeading"
import { cn } from "@/lib/utils"
import { extractHeadings } from "@/lib/postHeadings"

interface TableOfContentsProps {
  collapsible?: boolean
  content: JSONContent
}

export function TableOfContents({
  collapsible = false,
  content,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("")
  const [isOpen, setIsOpen] = useState(false)
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

  const contents = (
    <nav
      aria-label="Mục lục"
      className={cn(
        "font-sans",
        !collapsible && "flex max-h-[calc(100vh-120px)] flex-col",
      )}
    >
      {!collapsible && (
        <h4 className="mb-3 shrink-0 text-[12px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Nội dung
        </h4>
      )}
      <ul
        className={cn(
          "relative flex flex-col",
          !collapsible &&
            "min-h-0 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]",
        )}
      >
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border-default"></div>
        {headings.map(({ id, level, text }) => (
          <li
            key={id}
          >
            <a
              className={cn(
                "relative block transition-colors",
                activeId === id
                  ? "font-semibold text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              href={`#${id}`}
            >
              {activeId === id && (
                <motion.div 
                  layoutId="toc-indicator" 
                  className="absolute left-[0px] top-0 bottom-0 w-[2px] bg-accent shadow-[0_0_8px_var(--accent)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <TableOfContentsHeading active={activeId === id} level={level}>
                {text}
              </TableOfContentsHeading>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )

  if (!collapsible) return contents

  return (
    <div className="rounded-[18px] border border-border-default/80 bg-background/90 px-5 py-4 shadow-sm backdrop-blur-xl dark:bg-background/80">
      <button
        aria-expanded={isOpen}
        aria-label="Mục lục"
        className="flex w-full cursor-pointer items-center justify-between text-left font-sans text-sm font-bold text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Mục lục
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        aria-hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 pr-2">
            {contents}
          </div>
        </div>
      </div>
    </div>
  )
}
