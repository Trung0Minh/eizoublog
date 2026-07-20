import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { EmptyState } from "@/components/ui/EmptyState"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { parsePostListSort } from "@/lib/postListSort"
import { getCachedPublishedPosts } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

interface ArchivePageProps {
  params: Promise<{ month: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function formatArchiveMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null

  const [yearPart, monthPart] = month.split("-")
  const year = Number(yearPart)
  const monthIndex = Number(monthPart) - 1

  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
    return null
  }

  return `${monthPart}/${yearPart}`
}

export async function generateMetadata({
  params,
}: ArchivePageProps): Promise<Metadata> {
  const { month } = await params
  const archiveLabel = formatArchiveMonth(month)

  if (!archiveLabel) {
    return buildMetadata({ canonicalPath: `/archive/${month}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/archive/${month}`,
    description: `Bài viết được xuất bản trong ${archiveLabel}`,
    title: archiveLabel,
  })
}

export default async function ArchivePage({
  params,
  searchParams,
}: ArchivePageProps) {
  const [{ month }, { page: pageParam, sort: sortParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const archiveLabel = formatArchiveMonth(month)

  if (!archiveLabel) {
    notFound()
  }

  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const { posts, total } = await getCachedPublishedPosts(
    page,
    PAGE_SIZE,
    sort,
    month,
  )

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <ScrollReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Lưu trữ
          </p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            <TextReveal text={archiveLabel} />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Bài viết được xuất bản trong {archiveLabel}.
          </p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.2}>
        <section className="space-y-6">
          <div className="flex justify-end">
            <PostSortTabs basePath={`/archive/${month}`} sort={sort} />
          </div>
          {posts.length === 0 ? (
            <EmptyState
              description="Chưa có bài viết nào được xuất bản trong tháng này."
              title="Không tìm thấy bài viết"
            />
          ) : (
            <PostList
              pagination={{
                page,
                pageSize: PAGE_SIZE,
                query: { sort: sort === "latest" ? undefined : sort },
                total,
              }}
              posts={posts}
            />
          )}
        </section>
      </ScrollReveal>
    </PageContainer>
  )
}
