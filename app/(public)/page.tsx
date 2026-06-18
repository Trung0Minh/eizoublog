import { Suspense } from "react"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { HomePostList } from "@/app/(public)/HomePostList"
import { Loader } from "@/components/ui/Loader"
import { getCachedSidebarData } from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function HomeSectionLoading() {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[360px] items-center justify-center"
      role="status"
    >
      <span className="sr-only">Đang tải bài viết</span>
      <Loader aria-hidden="true" size="md" />
    </div>
  )
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
          <Suspense fallback={<HomeSectionLoading />}>
            <HomePostList page={page} sort={sort} />
          </Suspense>
        </section>
        <Suspense fallback={null}>
          <HomeSidebar />
        </Suspense>
      </div>
    </PageContainer>
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
