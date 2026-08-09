"use client"

import { ChevronDown } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import type { PostHeading } from "@/lib/postHeadings"
import { cn } from "@/lib/utils"

const MOBILE_TOC_TRANSITION_MS = 300

export function EventAnthologyTableOfContents({
  collapsible = false,
  headings,
}: {
  collapsible?: boolean
  headings: PostHeading[]
}) {
  const [activeId, setActiveId] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const groups = useMemo(() => {
    const result: Array<{ children: PostHeading[]; writer: PostHeading }> = []

    headings.forEach((heading) => {
      if (heading.level === 1) {
        result.push({ children: [], writer: heading })
      } else {
        result.at(-1)?.children.push(heading)
      }
    })

    return result
  }, [headings])
  const [expandedWriterIds, setExpandedWriterIds] = useState<string[]>(
    groups[0] ? [groups[0].writer.id] : [],
  )
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>())
  const pendingNavigationRef = useRef(false)
  const pendingNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function navigateToHeading(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault()
    setActiveId(id)
    pendingNavigationRef.current = true
    if (pendingNavigationTimerRef.current) {
      clearTimeout(pendingNavigationTimerRef.current)
    }
    window.history.pushState(null, "", `#${id}`)
    const scrollToHeading = () => {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        pendingNavigationTimerRef.current = setTimeout(() => {
          pendingNavigationRef.current = false
        }, 900)
      })
    }

    if (collapsible && mobileOpen) {
      setMobileOpen(false)
      pendingNavigationTimerRef.current = setTimeout(
        scrollToHeading,
        MOBILE_TOC_TRANSITION_MS,
      )
      return
    }

    if (collapsible) setMobileOpen(false)
    scrollToHeading()
  }

  useEffect(() => {
    const writerIdByHeadingId = new Map<string, string>()
    let writerId = ""

    headings.forEach((heading) => {
      if (heading.level === 1) writerId = heading.id
      if (writerId) writerIdByHeadingId.set(heading.id, writerId)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        if (pendingNavigationRef.current) return

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          setActiveId(entry.target.id)

          const activeWriterId = writerIdByHeadingId.get(entry.target.id)
          if (activeWriterId) {
            setExpandedWriterIds((current) =>
              current.includes(activeWriterId)
                ? current
                : [...current, activeWriterId],
            )
          }
        })
      },
      { rootMargin: "-20% 0% -65% 0%" },
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => {
      observer.disconnect()
      if (pendingNavigationTimerRef.current) {
        clearTimeout(pendingNavigationTimerRef.current)
      }
    }
  }, [headings])

  useEffect(() => {
    if (collapsible) return
    linkRefs.current.get(activeId)?.scrollIntoView({ block: "nearest" })
  }, [activeId, collapsible, expandedWriterIds])

  const contents = (
    <nav aria-label="Mục lục sự kiện" className="font-sans">
      {!collapsible && (
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-text-tertiary">
          Tác giả
        </p>
      )}
      <ol className="border-l border-border-default">
        {groups.map(({ children, writer }) => {
          const isExpanded = expandedWriterIds.includes(writer.id)
          const isWriterActive =
            activeId === writer.id || children.some(({ id }) => id === activeId)

          return (
            <li className="mt-3 first:mt-0" key={writer.id}>
              <div className="relative flex items-center gap-1">
                {isWriterActive && (
                  <span className="absolute -left-px inset-y-1 w-0.5 bg-accent" />
                )}
                <a
                  className={cn(
                    "min-w-0 flex-1 py-1.5 pl-3 text-[12px] font-bold leading-snug text-text-primary transition-colors hover:text-accent",
                    isWriterActive && "text-accent",
                  )}
                  href={`#${writer.id}`}
                  onClick={(event) => {
                    setExpandedWriterIds((current) =>
                      current.includes(writer.id)
                        ? current
                        : [...current, writer.id],
                    )
                    navigateToHeading(event, writer.id)
                  }}
                  ref={(element) => {
                    if (element) linkRefs.current.set(writer.id, element)
                    else linkRefs.current.delete(writer.id)
                  }}
                >
                  {writer.text}
                </a>
                {children.length > 0 && (
                  <button
                    aria-expanded={isExpanded}
                    aria-label={`Thu gọn hoặc mở rộng các mục của ${writer.text}`}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-subtle-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() =>
                      setExpandedWriterIds((current) =>
                        current.includes(writer.id)
                          ? current.filter((id) => id !== writer.id)
                          : [...current, writer.id],
                      )
                    }
                    type="button"
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </div>

              {children.length > 0 && (
                <div
                  aria-hidden={!isExpanded}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <ol className="min-h-0 overflow-hidden">
                  {children.map((heading) => (
                    <li key={heading.id}>
                      <a
                        className={cn(
                          "relative block py-1.5 text-[12px] leading-snug text-text-secondary transition-colors hover:text-text-primary",
                          activeId === heading.id && "text-accent",
                        )}
                        href={`#${heading.id}`}
                        onClick={(event) => navigateToHeading(event, heading.id)}
                        ref={(element) => {
                          if (element) linkRefs.current.set(heading.id, element)
                          else linkRefs.current.delete(heading.id)
                        }}
                        style={{
                          paddingLeft: 24 + (heading.level - 2) * 10,
                        }}
                        tabIndex={isExpanded ? undefined : -1}
                      >
                        {activeId === heading.id && (
                          <span className="absolute -left-px inset-y-1 w-0.5 bg-accent" />
                        )}
                        {heading.text}
                      </a>
                    </li>
                  ))}
                  </ol>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )

  if (!collapsible) return contents

  return (
    <div className="rounded-[18px] border border-border-default/80 bg-background/90 px-5 py-4 shadow-sm backdrop-blur-xl dark:bg-background/80">
      <button
        aria-expanded={mobileOpen}
        aria-label="Mục lục"
        className="flex w-full cursor-pointer items-center justify-between text-left font-sans text-sm font-bold text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        onClick={() => setMobileOpen((current) => !current)}
        type="button"
      >
        Mục lục
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            mobileOpen && "rotate-180",
          )}
        />
      </button>
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          mobileOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
        data-testid="mobile-event-toc-panel"
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 max-h-[60vh] overflow-y-auto overscroll-contain pr-2">
            {contents}
          </div>
        </div>
      </div>
    </div>
  )
}
