import Link from "next/link"

import {
  POST_LIST_SORT_OPTIONS,
  type PostListSort,
} from "@/lib/postListSort"
import { cn } from "@/lib/utils"

interface PostSortTabsProps {
  basePath: string
  query?: Record<string, string | undefined>
  sort: PostListSort
}

function buildSortHref(
  basePath: string,
  query: Record<string, string | undefined>,
  sort: PostListSort,
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value)
    }
  }

  if (sort !== "latest") {
    params.set("sort", sort)
  } else {
    params.delete("sort")
  }

  params.delete("page")

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export function PostSortTabs({
  basePath,
  query = {},
  sort,
}: PostSortTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-text-tertiary">Sắp xếp:</span>
      <div
        aria-label="Sắp xếp bài viết"
        className="flex rounded-md border border-border-default bg-subtle-bg/30 p-0.5"
        role="tablist"
      >
        {POST_LIST_SORT_OPTIONS.map((option) => {
          const isActive = sort === option.value

          return (
            <Link
              aria-selected={isActive}
              className={cn(
                "rounded-[4px] border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all",
                isActive
                  ? "border-border-default/60 bg-background text-editorial shadow-sm"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
              href={buildSortHref(basePath, query, option.value)}
              key={option.value}
              role="tab"
            >
              {option.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
