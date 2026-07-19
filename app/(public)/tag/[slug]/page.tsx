import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { EmptyState } from "@/components/ui/EmptyState"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { getCachedTagBySlug, getCachedTagPosts } from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { buildMetadata } from "@/lib/seo"

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getCachedTagBySlug(slug)

  if (!tag) {
    return buildMetadata({ canonicalPath: `/tag/${slug}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/tag/${slug}`,
    description: `Posts tagged with ${tag.name}`,
    title: `#${tag.name}`,
  })
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [{ slug }, { page: pageParam, sort: sortParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const [tag, { posts, total }] = await Promise.all([
    getCachedTagBySlug(slug),
    getCachedTagPosts(slug, page, PAGE_SIZE, sort),
  ])

  if (!tag) {
    notFound()
  }

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <ScrollReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Thẻ
          </p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            <TextReveal text={`#${tag.name}`} />
          </h1>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.2}>
        <section className="space-y-6">
          <div className="flex justify-end">
            <PostSortTabs basePath={`/tag/${slug}`} sort={sort} />
          </div>
          {posts.length === 0 ? (
          <EmptyState
            description="Chưa có bài viết nào được xuất bản với thẻ này."
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
