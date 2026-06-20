import type { PostStatus } from "@prisma/client"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminPostsTable } from "@/components/admin/AdminPostsTable"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { Pagination } from "@/components/ui/Pagination"
import {
  getCachedAdminDashboardStats,
  getCachedAdminPosts,
} from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

interface AdminPostsPageProps {
  searchParams: Promise<{ page?: string; sort?: string; status?: string }>
}

const PAGE_SIZE = 20
const STATUS_FILTERS: Array<{ href: string; label: string; status?: PostStatus }> = [
  { href: "/admin/posts", label: "All" },
  { href: "/admin/posts?status=PUBLISHED", label: "Published", status: "PUBLISHED" },
  { href: "/admin/posts?status=DRAFT", label: "Drafts", status: "DRAFT" },
  { href: "/admin/posts?status=ARCHIVED", label: "Archived", status: "ARCHIVED" },
]

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

function parseStatus(value?: string): PostStatus | undefined {
  return value === "PUBLISHED" || value === "DRAFT" || value === "ARCHIVED"
    ? value
    : undefined
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const { page: pageParam, sort: sortParam, status: statusParam } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const status = parseStatus(statusParam)

  const [{ posts, total }, counts] = await Promise.all([
    getCachedAdminPosts(page, status, PAGE_SIZE, sort),
    getCachedAdminDashboardStats(),
  ])
  const allCount = counts.publishedPosts + counts.draftPosts + counts.archivedPosts
  const filterLabels: Record<string, string> = {
    "/admin/posts": `All (${allCount})`,
    "/admin/posts?status=ARCHIVED": `Archived (${counts.archivedPosts})`,
    "/admin/posts?status=DRAFT": `Drafts (${counts.draftPosts})`,
    "/admin/posts?status=PUBLISHED": `Published (${counts.publishedPosts})`,
  }

  return (
    <div>
      <AdminPageHeader
        subtitle={`${counts.publishedPosts.toLocaleString()} published · ${counts.draftPosts.toLocaleString()} drafts · ${counts.archivedPosts.toLocaleString()} archived`}
        title="Posts"
      />

      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="inline-flex w-fit gap-1 overflow-x-auto rounded-full border border-border-default bg-subtle-bg/50 p-[3px]">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.status === status || (!filter.status && !status)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary",
                  active &&
                    "bg-background font-semibold text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
                )}
                href={filter.href}
                key={filter.href}
                prefetch={false}
              >
                {filterLabels[filter.href] ?? filter.label}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full md:w-[220px]">
            <Search
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
            />
            <input
              className="h-[34px] w-full rounded-full border border-border-default bg-transparent pl-8 pr-2.5 text-[13px] outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
              placeholder="Search posts..."
              type="text"
            />
          </div>
          <Link
            className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            href="/dashboard/new"
            prefetch={false}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            New post
          </Link>
        </div>
      </div>

      <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6">
        <AdminPostsTable posts={posts} />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          prefetch={false}
          query={{ sort: sort === "latest" ? undefined : sort, status }}
          total={total}
        />
      </ScrollReveal>
    </div>
  )
}
