import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SearchX } from "lucide-react"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  getCachedCategoryBySlug,
  getCachedCategoryPosts,
} from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { buildMetadata } from "@/lib/seo"

interface CategoryPageProps {
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
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    return buildMetadata({ canonicalPath: `/category/${slug}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/category/${slug}`,
    description:
      category.description ?? `Posts in the ${category.name} category`,
    title: category.name,
  })
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, { page: pageParam, sort: sortParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const { posts, total } = await getCachedCategoryPosts(
    category.id,
    page,
    PAGE_SIZE,
    sort,
  )

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Category
        </p>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex justify-end">
          <PostSortTabs basePath={`/category/${slug}`} sort={sort} />
        </div>
        {posts.length === 0 ? (
          <EmptyState
            description="There are no published posts in this category yet. Check back later!"
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
