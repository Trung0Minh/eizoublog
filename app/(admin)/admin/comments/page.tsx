import type { CommentStatus } from "@prisma/client"
import { Search } from "lucide-react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable"
import { Pagination } from "@/components/ui/Pagination"
import {
  getCachedAdminCommentCounts,
  getCachedAdminComments,
} from "@/lib/queries"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

interface AdminCommentsPageProps {
  searchParams: Promise<{ page?: string; status?: string }>
}

const PAGE_SIZE = 30
const COMMENT_TABS: Array<{
  href: string
  key: "APPROVED" | "PENDING" | "SPAM"
  label: string
}> = [
  { href: "/admin/comments?status=PENDING", key: "PENDING", label: "Pending" },
  { href: "/admin/comments", key: "APPROVED", label: "Approved" },
  { href: "/admin/comments?status=SPAM", key: "SPAM", label: "Spam" },
]

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

function parseStatus(value?: string): CommentStatus | "PENDING" {
  if (value === "SPAM") {
    return "SPAM"
  }

  if (value === "PENDING") {
    return "PENDING"
  }

  return "APPROVED"
}

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const { page: pageParam, status: statusParam } = await searchParams
  const page = parsePage(pageParam)
  const status = parseStatus(statusParam)

  const [{ approvedComments, pendingComments, spamComments }, commentsData] =
    await Promise.all([
      getCachedAdminCommentCounts(),
      status === "PENDING"
        ? Promise.resolve({ comments: [], total: 0 })
        : getCachedAdminComments(page, status, PAGE_SIZE),
    ])
  const tabCounts = {
    APPROVED: approvedComments,
    PENDING: pendingComments,
    SPAM: spamComments,
  }

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Manage reader discussions"
        title="Comments"
      />

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="inline-flex w-fit rounded-full border-[2px] border-border-default bg-subtle-bg/30 p-1 backdrop-blur-md">
          {COMMENT_TABS.map((tab) => {
            const active = status === tab.key

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary",
                  active &&
                    "bg-white dark:bg-zinc-800 text-text-primary shadow-sm",
                )}
                href={tab.href}
                key={tab.key}
                prefetch={false}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-sm",
                    active
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-border-default/50 text-text-tertiary border border-transparent",
                  )}
                >
                  {tabCounts[tab.key]}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="relative w-full md:w-[280px]">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          />
          <input
            className="h-11 w-full rounded-full border-[2px] border-border-default bg-subtle-bg/30 pl-10 pr-4 text-[14px] font-medium outline-none transition-all placeholder:text-text-tertiary focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 backdrop-blur-md"
            placeholder="Search comments..."
            type="text"
          />
        </div>
      </div>

      <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-2 sm:p-6 backdrop-blur-md shadow-sm">
        <AdminCommentsTable
          comments={commentsData.comments}
          emptyLabel={`No ${COMMENT_TABS.find((tab) => tab.key === status)?.label.toLowerCase()} comments found.`}
          status={status}
        />

        <div className="mt-6 px-4 pb-2 sm:px-0 sm:pb-0">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            prefetch={false}
            query={{ status: status === "APPROVED" ? undefined : status }}
            total={commentsData.total}
          />
        </div>
      </ScrollReveal>
    </div>
  )
}
