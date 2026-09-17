"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export function PostTags({ tags }: { tags: { name: string; slug: string }[] }) {
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [visibleCount, setVisibleCount] = useState(tags.length)

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    // Invisible links retain their layout so resizing can measure every row.
    const measure = () => {
      setVisibleCount(Array.from(list.children).filter(
        (child) => (child as HTMLElement).offsetTop < 80,
      ).length)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    measure()
    void document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [tags])

  if (!tags.length) return null

  return (
    <div className="mt-4 w-full">
      <div
        className={cn("relative flex flex-wrap items-center gap-2", !expanded && "max-h-20 overflow-hidden md:max-h-none md:overflow-visible")}
        id={id}
        ref={listRef}
      >
        {tags.map((tag, index) => (
          <Link
            className={cn(
              "hover-glitch flex h-9 max-w-full items-center rounded-full border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:h-auto md:py-[6px] md:text-[11px]",
              !expanded && index >= visibleCount && "invisible md:visible",
            )}
            href={`/tag/${tag.slug}`}
            key={tag.slug}
          >
            <span className="truncate">{tag.name}</span>
          </Link>
        ))}
      </div>
      {visibleCount < tags.length && (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          className="mt-1 min-h-11 rounded-md px-1 text-xs font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:hidden"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? "Thu gọn" : `+${tags.length - visibleCount} thẻ khác`}
        </button>
      )}
    </div>
  )
}
