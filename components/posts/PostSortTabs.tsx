"use client"

import Link from "next/link"
import { useState } from "react"

import {
  POST_LIST_SORT_OPTIONS,
  type PostListSort,
} from "@/lib/postListSort"
import { cn } from "@/lib/utils"
import { Loader } from "@/components/ui/Loader"

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
  const [pendingSort, setPendingSort] = useState<PostListSort | null>(null)

  return (
    <div className="flex items-center gap-2">
      <div
        aria-label="Sắp xếp bài viết"
        className="flex rounded-full border-[2px] border-border-default bg-subtle-bg/30 p-1 backdrop-blur-sm"
        role="tablist"
      >
        {POST_LIST_SORT_OPTIONS.map((option) => {
          const isActive = sort === option.value
          const isPending = pendingSort === option.value && !isActive

          return (
            <Link
              aria-selected={isActive}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider transition-all duration-300",
                isActive
                  ? "bg-accent text-white shadow-md"
                  : "text-text-secondary hover:text-text-primary hover:bg-subtle-bg/50",
              )}
              href={buildSortHref(basePath, query, option.value)}
              key={option.value}
              onClick={() => {
                if (!isActive) {
                  setPendingSort(option.value)
                }
              }}
              role="tab"
            >
              {isPending && <Loader aria-hidden="true" size="sm" />}
              {option.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
