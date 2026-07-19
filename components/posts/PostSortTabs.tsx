"use client"

import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import {
  POST_LIST_SORT_OPTIONS,
  type PostListSort,
} from "@/lib/postListSort"

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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="relative w-full max-w-[240px]">
      <select
        aria-label="Sắp xếp bài viết"
        className="h-11 w-full cursor-pointer appearance-none rounded-[14px] border border-border-default bg-background/85 px-4 pr-10 text-sm font-bold text-text-primary shadow-sm outline-none transition-colors hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        onChange={(event) => {
          const nextSort = event.target.value as PostListSort
          startTransition(() => {
            router.push(buildSortHref(basePath, query, nextSort), {
              scroll: false,
            })
          })
        }}
        value={sort}
      >
        {POST_LIST_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-accent"
      />
    </div>
  )
}
