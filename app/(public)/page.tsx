import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { PostList } from "@/components/posts/PostList"
import {
  PostListSkeleton,
  SidebarSkeleton,
} from "@/components/posts/PostListSkeleton"
import { getCachedPublishedPosts, getCachedSidebarData } from "@/lib/queries"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function parseSort(sort?: string): "latest" | "oldest" | "comments" {
  if (sort === "oldest" || sort === "comments") {
    return sort
  }
  return "latest"
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { page: pageParam, sort: sortParam } = await searchParams
  const page = parsePage(pageParam)
  const sort = parseSort(sortParam)

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
  const sort = parseSort(sortParam)

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

export async function HomePostList({ page, sort }: { page: number; sort: "latest" | "oldest" | "comments" }) {
  const { posts, total } = await getCachedPublishedPosts(page, PAGE_SIZE, sort)

  const sortOptions: { value: "latest" | "oldest" | "comments"; label: string }[] = [
    { value: "latest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "comments", label: "Nhiều bình luận" },
  ]

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Bài viết đã xuất bản</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-tertiary">Sắp xếp:</span>
          <div className="flex rounded-md border border-border-default bg-subtle-bg/30 p-0.5" role="tablist" aria-label="Sắp xếp bài viết">
            {sortOptions.map((option) => {
              const isActive = sort === option.value
              const queryStr = option.value !== "latest" ? `?sort=${option.value}` : "/"
              return (
                <Link
                  href={queryStr}
                  key={option.value}
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-[4px] px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-background text-editorial shadow-sm border border-border-default/60"
                      : "text-text-secondary hover:text-text-primary border border-transparent"
                  }`}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </div>
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
