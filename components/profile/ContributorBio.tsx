"use client"

import type { JSONContent } from "@tiptap/react"
import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"

import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { cn } from "@/lib/utils"

function parseRichBio(bio: string): JSONContent | null {
  if (!bio.startsWith("{")) return null

  try {
    const parsed: unknown = JSON.parse(bio)
    if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
      return parsed as JSONContent
    }
  } catch {
    return null
  }

  return null
}

function getRichText(value: JSONContent): string {
  if (value.type === "text") return value.text ?? ""
  return value.content?.map(getRichText).join(" ") ?? ""
}

export function ContributorBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const richBio = parseRichBio(bio)
  const visibleText = richBio ? getRichText(richBio) : bio
  const isCollapsible = visibleText.trim().length > 120

  return (
    <div className="text-[14px] text-text-secondary">
      <div
        className={cn(
          "[&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0",
          !expanded && isCollapsible && "line-clamp-3",
        )}
        data-testid="contributor-bio-content"
        id={contentId}
      >
        {richBio ? <StaticPostContent content={richBio} /> : <span>{bio}</span>}
      </div>

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
