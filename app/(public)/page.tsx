import type { Metadata } from "next"
import { cookies } from "next/headers"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { HomePostList } from "@/app/(public)/HomePostList"
import { getCachedSidebarData, getHomePageData } from "@/lib/queries"
import { HeroCarousel } from "@/components/posts/HeroCarousel"
import { HomeIntro } from "@/components/home/HomeIntro"
import { parsePostListSort } from "@/lib/postListSort"
import { buildMetadata, getAppUrl, getAppName } from "@/lib/seo"
import { ClientAdminBackgroundFlyout } from "@/components/admin/ClientAdminBackgroundFlyout"
import {
  resolveAppearanceSeason,
} from "@/lib/appearanceSession"

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
  const [resolvedSearchParams, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ])
  const {
    archive: archiveParam,
    page: pageParam,
    sort: sortParam,
  } = resolvedSearchParams
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const archive = parseArchiveMonth(archiveParam)

  const { carouselPosts, listData, sidebarData } = await getHomePageData({
    archive,
    page,
    sort,
  })
  const initialSeason = resolveAppearanceSeason(
    cookieStore.get("appearanceSeason")?.value,
  )

  return (
    <>
      <HomeIntro appName={getAppName()} initialSeason={initialSeason} />
      <PageContainer size="default">
        <div className="w-full flex justify-center">
          <HeroCarousel posts={carouselPosts} />
        </div>
        <HomePostList
          archiveMonth={archive}
          data={listData}
          page={page}
          sidebar={<HomeSidebar data={sidebarData} />}
          sort={sort}
        />
      </PageContainer>
      <ClientAdminBackgroundFlyout />
    </>
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
      hasMore={data.hasMore}
      newsletter={<NewsletterForm />}
      recentComments={data.recentComments}
      recentPosts={data.recentPosts}
    />
  )
}
