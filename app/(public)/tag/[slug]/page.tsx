import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SearchX } from "lucide-react"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { EmptyState } from "@/components/ui/EmptyState"
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
  const tag = await getCachedTagBySlug(slug)

  if (!tag) {
    notFound()
  }

  const { posts, total } = await getCachedTagPosts(tag.id, page, PAGE_SIZE, sort)

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Tag
        </p>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">#{tag.name}</h1>
      </section>

      <section className="space-y-6">
        <div className="flex justify-end">
          <PostSortTabs basePath={`/tag/${slug}`} sort={sort} />
        </div>
        {posts.length === 0 ? (
          <EmptyState
            description="There are no published posts with this tag yet. Check back later!"
            icon={SearchX}
            title="No posts found"
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
    </PageContainer>
  )
}
