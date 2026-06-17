import { Suspense } from "react"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import {
  PostListSkeleton,
  SidebarSkeleton,
} from "@/components/posts/PostListSkeleton"
import { getCachedPublishedPosts, getCachedSidebarData } from "@/lib/queries"
import {
  parsePostListSort,
  type PostListSort,
} from "@/lib/postListSort"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { page: pageParam, sort: sortParam } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)

  const sortQuery = sort !== "latest" ? `&sort=${sort}` : ""

  return buildMetadata({
    canonicalPath: "/",
    ...(page > 1 && {
      canonicalUrl: `${getAppUrl()}?page=${page}${sortQuery}`,
      noIndex: true,
      noIndexFollow: true,
    }),
  })
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageParam, sort: sortParam } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)

  return (
    <PageContainer size="wide">
      <div className="flex flex-col gap-12 lg:flex-row xl:gap-[48px]">
        <section className="flex-1 lg:w-[calc(100%-288px)] xl:w-[calc(100%-288px)] flex flex-col" aria-label="Bài viết đã xuất bản">
          <Suspense fallback={<PostListSkeleton />}>
            <HomePostList page={page} sort={sort} />
          </Suspense>
        </section>
        <Suspense fallback={<SidebarSkeleton />}>
          <HomeSidebar />
        </Suspense>
      </div>
    </PageContainer>
  )
}

export async function HomePostList({ page, sort }: { page: number; sort: PostListSort }) {
  const { posts, total } = await getCachedPublishedPosts(page, PAGE_SIZE, sort)

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Bài viết đã xuất bản</h2>
        <PostSortTabs basePath="/" sort={sort} />
      </div>

      <PostList
        emptyMessage="Chưa có bài viết nào được xuất bản."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        posts={posts}
      />
    </div>
  )
}

async function HomeSidebar() {
  const { categories, recentPosts } = await getCachedSidebarData()

  return (
    <Sidebar
      categories={categories}
      newsletter={<NewsletterForm />}
      recentPosts={recentPosts}
    />
  )
}
