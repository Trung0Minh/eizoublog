"use client"

import { useEffect, useState } from "react"

import type { PostHeading } from "@/lib/postHeadings"
import { cn } from "@/lib/utils"

export function EventAnthologyTableOfContents({
  headings,
}: {
  headings: PostHeading[]
}) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: "-20% 0% -65% 0%" },
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  return (
    <nav aria-label="Event contents" className="font-sans">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-text-tertiary">
        Contributors
      </p>
      <ol className="border-l border-border-default">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              className={cn(
                "relative block py-1.5 text-[12px] leading-snug transition-colors",
                heading.level === 1
                  ? "mt-3 font-bold text-text-primary first:mt-0"
                  : "text-text-secondary hover:text-text-primary",
                activeId === heading.id && "text-accent",
              )}
              href={`#${heading.id}`}
              style={{ paddingLeft: heading.level === 1 ? 12 : 24 + (heading.level - 2) * 10 }}
            >
              {activeId === heading.id && (
                <span className="absolute -left-px inset-y-1 w-0.5 bg-accent" />
              )}
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
