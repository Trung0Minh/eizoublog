"use client"

import { ChevronDown } from "lucide-react"
import type { MouseEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { PostHeading } from "@/lib/postHeadings"
import { resolveActiveHeadingId } from "@/lib/tableOfContents"
import { cn } from "@/lib/utils"
import { TableOfContentsHeading } from "@/components/posts/TableOfContentsHeading"

const MOBILE_TOC_TRANSITION_MS = 300
const CLICK_LOCK_DURATION_MS = 900

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
  const listRef = useRef<HTMLOListElement>(null)
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>())
  const headingIds = useMemo(() => headings.map(({ id }) => id), [headings])
  const writerIdByHeadingId = useMemo(() => {
    const result = new Map<string, string>()
    let writerId = ""

    headings.forEach((heading) => {
      if (heading.level === 1) writerId = heading.id
      if (writerId) result.set(heading.id, writerId)
    })

    return result
  }, [headings])
  const clickLockRef = useRef<{ expiresAt: number; id: string } | null>(null)
  const clickLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleWriter(writerId: string) {
    setExpandedWriterIds((current) =>
      current.includes(writerId)
        ? current.filter((id) => id !== writerId)
        : [...current, writerId],
    )
  }

  const updateActiveHeading = useCallback(() => {
    const clickLock = clickLockRef.current
    const nextActiveId =
      clickLock && Date.now() < clickLock.expiresAt
        ? clickLock.id
        : resolveActiveHeadingId(headingIds)

    if (!clickLock || Date.now() >= clickLock.expiresAt) {
      clickLockRef.current = null
    }
    setActiveId(nextActiveId)

    const activeWriterId = writerIdByHeadingId.get(nextActiveId)
    if (activeWriterId) {
      setExpandedWriterIds((current) =>
        current.includes(activeWriterId)
          ? current
          : [...current, activeWriterId],
      )
    }
  }, [headingIds, writerIdByHeadingId])

  const lockActiveHeading = useCallback(
    (id: string) => {
      clickLockRef.current = {
        expiresAt: Date.now() + CLICK_LOCK_DURATION_MS,
        id,
      }
      setActiveId(id)

      if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)
      clickLockTimerRef.current = setTimeout(() => {
        clickLockTimerRef.current = null
        clickLockRef.current = null
        updateActiveHeading()
      }, CLICK_LOCK_DURATION_MS)
    },
    [updateActiveHeading],
  )

  function navigateToHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return
    }

    lockActiveHeading(id)
    if (!collapsible) return

    event.preventDefault()
    setMobileOpen(false)
    if (mobileNavigationTimerRef.current) {
      clearTimeout(mobileNavigationTimerRef.current)
    }
    mobileNavigationTimerRef.current = setTimeout(() => {
      window.history.pushState(null, "", `#${id}`)
      window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches
        document.getElementById(id)?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })
      })
      mobileNavigationTimerRef.current = null
    }, mobileOpen ? MOBILE_TOC_TRANSITION_MS : 0)
  }

  useEffect(() => {
    updateActiveHeading()
    window.addEventListener("hashchange", updateActiveHeading)
    window.addEventListener("resize", updateActiveHeading)
    window.addEventListener("scroll", updateActiveHeading, { passive: true })

    const resizeObserver = new ResizeObserver(updateActiveHeading)
    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("hashchange", updateActiveHeading)
      window.removeEventListener("resize", updateActiveHeading)
      window.removeEventListener("scroll", updateActiveHeading)
    }
  }, [updateActiveHeading])

  useEffect(() => {
    return () => {
      if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)
      if (mobileNavigationTimerRef.current) {
        clearTimeout(mobileNavigationTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (collapsible) return

    const list = listRef.current
    const activeLink = linkRefs.current.get(activeId)
    if (!list || !activeLink) return

    const listBounds = list.getBoundingClientRect()
    const linkBounds = activeLink.getBoundingClientRect()

    if (linkBounds.top < listBounds.top) {
      list.scrollTop -= listBounds.top - linkBounds.top
    } else if (linkBounds.bottom > listBounds.bottom) {
      list.scrollTop += linkBounds.bottom - listBounds.bottom
    }
  }, [activeId, collapsible])

  const contents = (
    <nav
      aria-label="Mục lục sự kiện"
      className={cn(
        "font-sans [overflow-anchor:none]",
        !collapsible && "flex max-h-[calc(100vh-8rem)] flex-col",
      )}
    >
      {!collapsible && (
        <p className="mb-4 shrink-0 text-[12px] font-bold uppercase tracking-[0.16em] text-text-tertiary">
          Tác giả
        </p>
      )}
      <ol
        className={cn(
          "border-l border-border-default",
          !collapsible &&
            "min-h-0 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]",
        )}
        ref={listRef}
      >
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
                    "min-w-0 flex-1 py-1.5 pl-3 text-[14px] font-bold leading-snug text-text-primary transition-colors hover:text-accent",
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
                    onClick={() => toggleWriter(writer.id)}
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
                  {children.map((heading, headingIndex) => {
                    const previousHeading = children[headingIndex - 1]
                    const startsNewGroup =
                      heading.level === 2 && previousHeading?.level !== 2
                    return (
                    <li
                      className={cn(
                        heading.level === 2 && "mt-2 first:mt-1",
                        startsNewGroup && "mt-3",
                      )}
                      key={heading.id}
                    >
                      <a
                        className={cn(
                          "relative block text-text-secondary transition-colors hover:text-text-primary",
                          activeId === heading.id &&
                            "bg-accent/[0.07] text-accent",
                        )}
                        href={`#${heading.id}`}
                        onClick={(event) => navigateToHeading(event, heading.id)}
                        ref={(element) => {
                          if (element) linkRefs.current.set(heading.id, element)
                          else linkRefs.current.delete(heading.id)
                        }}
                        tabIndex={isExpanded ? undefined : -1}
                      >
                        {activeId === heading.id && (
                          <span className="absolute -left-px inset-y-1 w-0.5 bg-accent" />
                        )}
                        <TableOfContentsHeading
                          active={activeId === heading.id}
                          basePadding={12}
                          level={heading.level}
                        >
                          {heading.text}
                        </TableOfContentsHeading>
                      </a>
                    </li>
                    )
                  })}
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
          <div className="mt-4 pr-2">
            {contents}
          </div>
        </div>
      </div>
    </div>
  )
}
