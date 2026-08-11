"use client"

import { ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"

import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { getProfileBioVisibleText, parseProfileBio } from "@/lib/profileBio"
import { cn } from "@/lib/utils"

export function ContributorBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const richBio = parseProfileBio(bio)
  const visibleText = getProfileBioVisibleText(bio)
  const isCollapsible = visibleText.trim().length > 120

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const measure = () => setFullHeight(element.scrollHeight)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [bio])

  return (
    <div className="contributor-bio text-[14px] text-text-secondary">
      <motion.div
        animate={{
          height:
            expanded || !isCollapsible ? fullHeight ?? "auto" : "4.5rem",
          opacity: expanded || !isCollapsible ? 1 : 0.94,
        }}
        className="overflow-hidden [&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0"
        data-collapsible={isCollapsible}
        data-expanded={expanded}
        data-testid="contributor-bio-content"
        id={contentId}
        initial={false}
        ref={contentRef}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: "easeInOut",
        }}
      >
        {richBio ? <StaticPostContent content={richBio} /> : <span>{bio}</span>}
      </motion.div>

      {isCollapsible && (
        <button
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-label={expanded ? "Thu gọn tiểu sử" : "Xem thêm tiểu sử"}
          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-sm text-[12px] font-bold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  )
}
