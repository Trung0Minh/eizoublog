import type { PostStatus } from "@prisma/client"
import { Plus } from "lucide-react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminPostsTable } from "@/components/admin/AdminPostsTable"
import { AdminPostSearch } from "@/components/admin/AdminPostSearch"
import { Pagination } from "@/components/ui/Pagination"
import {
  getCachedAdminDashboardStats,
  getCachedAdminPosts,
} from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

interface AdminPostsPageProps {
  searchParams: Promise<{ page?: string; sort?: string; status?: string; q?: string }>
}

const PAGE_SIZE = 20
const STATUS_FILTERS: Array<{ href: string; label: string; status?: PostStatus }> = [
  { href: "/admin/posts", label: "All" },
  { href: "/admin/posts?status=PUBLISHED", label: "Published", status: "PUBLISHED" },
  { href: "/admin/posts?status=DRAFT", label: "Drafts", status: "DRAFT" },
  { href: "/admin/posts?status=ARCHIVED", label: "Archived", status: "ARCHIVED" },
  { href: "/admin/posts?status=REMOVED", label: "Removed", status: "REMOVED" },
]

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

function parseStatus(value?: string): PostStatus | undefined {
  return value === "PUBLISHED" || value === "DRAFT" || value === "ARCHIVED" || value === "REMOVED"
    ? value
    : undefined
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const { page: pageParam, sort: sortParam, status: statusParam, q: queryParam } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const status = parseStatus(statusParam)
  const query = queryParam ? decodeURIComponent(queryParam) : undefined

  const [{ posts, total }, counts] = await Promise.all([
    getCachedAdminPosts(page, status, PAGE_SIZE, sort, query),
    getCachedAdminDashboardStats(),
  ])
  const allCount = counts.publishedPosts + counts.draftPosts + counts.archivedPosts + counts.removedPosts
  const filterLabels: Record<string, string> = {
    "/admin/posts": `All (${allCount})`,
    "/admin/posts?status=ARCHIVED": `Archived (${counts.archivedPosts})`,
    "/admin/posts?status=DRAFT": `Drafts (${counts.draftPosts})`,
    "/admin/posts?status=PUBLISHED": `Published (${counts.publishedPosts})`,
    "/admin/posts?status=REMOVED": `Removed (${counts.removedPosts})`,
  }
  const tableStateKey = [
    page,
    status ?? "all",
    sort,
    query ?? "",
    posts.map((post) => `${post.id}:${post.status}`).join(","),
  ].join("|")

  return (
    <div>
      <AdminPageHeader
        subtitle={`${counts.publishedPosts.toLocaleString()} published · ${counts.draftPosts.toLocaleString()} drafts · ${counts.archivedPosts.toLocaleString()} archived · ${counts.removedPosts.toLocaleString()} removed`}
        title="Posts"
      />

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center rounded-[24px] border border-border-default/50 bg-background/50 backdrop-blur-xl p-3 shadow-sm">
        <div className="inline-flex w-full gap-1 overflow-x-auto rounded-full bg-subtle-bg/50 p-1 md:w-fit">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.status === status || (!filter.status && !status)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold text-text-secondary transition-all hover:text-text-primary",
                  active &&
                    "bg-accent text-white shadow-md shadow-accent/20",
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminPostSearch />
          <Link
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 text-[13px] font-bold text-white transition-all hover:scale-105 shadow-md shadow-accent/20 hover:shadow-accent/40"
            href="/dashboard/new"
            prefetch={false}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New Post
          </Link>
        </div>
      </div>

      <ScrollReveal index={0} className="rounded-[32px] border border-border-default/50 bg-background/40 p-2 sm:p-6 shadow-sm backdrop-blur-xl">
        <AdminPostsTable key={tableStateKey} posts={posts} />

        <div className="mt-4 px-2">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            prefetch={false}
            query={{ q: query, sort: sort === "latest" ? undefined : sort, status }}
            total={total}
          />
        </div>
      </ScrollReveal>
    </div>
  )
}
