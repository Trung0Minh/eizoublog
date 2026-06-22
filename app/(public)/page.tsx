import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { HomePostList } from "@/app/(public)/HomePostList"
import { getCachedSidebarData, getCachedPublishedPosts } from "@/lib/queries"
import { HeroCarousel } from "@/components/posts/HeroCarousel"
import { parsePostListSort } from "@/lib/postListSort"
import type { PostListSort } from "@/lib/postListSort"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ archive?: string; page?: string; sort?: string }>
}

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function parseArchiveMonth(archive?: string) {
  return archive && /^\d{4}-\d{2}$/.test(archive) ? archive : undefined
}

export async function getHomePageData({
  archive,
  page,
  sort,
}: {
  archive?: string
  page: number
  sort: PostListSort
}) {
  const listDataPromise = getCachedPublishedPosts(page, 10, sort, archive)
  const sidebarDataPromise = getCachedSidebarData()
  const carouselPostsPromise =
    page === 1 && sort === "latest" && !archive
      ? listDataPromise.then(({ posts }) => posts.slice(0, 5))
      : getCachedPublishedPosts(1, 5, "latest").then(({ posts }) => posts)

  const [listData, sidebarData, carouselPosts] = await Promise.all([
    listDataPromise,
    sidebarDataPromise,
    carouselPostsPromise,
  ])

  return { carouselPosts, listData, sidebarData }
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const {
    archive: archiveParam,
    page: pageParam,
    sort: sortParam,
  } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const archive = parseArchiveMonth(archiveParam)

  const sortQuery = sort !== "latest" ? `&sort=${sort}` : ""
  const archiveQuery = archive ? `&archive=${archive}` : ""

  return buildMetadata({
    canonicalPath: "/",
    ...((page > 1 || archive) && {
      canonicalUrl: `${getAppUrl()}?page=${page}${sortQuery}${archiveQuery}`,
      noIndex: true,
      noIndexFollow: true,
    }),
  })
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const {
    archive: archiveParam,
    page: pageParam,
    sort: sortParam,
  } = await searchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const archive = parseArchiveMonth(archiveParam)

  const { carouselPosts, listData, sidebarData } = await getHomePageData({
    archive,
    page,
    sort,
  })

  return (
    <PageContainer size="default">
      <div className="w-full flex justify-center">
        <HeroCarousel posts={carouselPosts} />
      </div>
      <div className="flex flex-col gap-8 lg:gap-12 lg:flex-row xl:gap-[48px]">
        <section className="flex-1 lg:w-[calc(100%-288px)] xl:w-[calc(100%-288px)] flex flex-col">
          <HomePostList
            archiveMonth={archive}
            data={listData}
            page={page}
            sort={sort}
          />
        </section>
        <HomeSidebar data={sidebarData} />
      </div>
    </PageContainer>
  )
}

function HomeSidebar({
  data,
}: {
  data: Awaited<ReturnType<typeof getCachedSidebarData>>
}) {
  return (
    <Sidebar
      archives={data.archives}
      categories={data.categories}
      newsletter={<NewsletterForm />}
      recentPosts={data.recentPosts}
    />
  )
}
