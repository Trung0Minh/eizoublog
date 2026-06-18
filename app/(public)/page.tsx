import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { HomePostList } from "@/app/(public)/HomePostList"
import { getCachedSidebarData } from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
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

  return (
    <PageContainer size="wide">
      <div className="flex flex-col gap-12 lg:flex-row xl:gap-[48px]">
        <section className="flex-1 lg:w-[calc(100%-288px)] xl:w-[calc(100%-288px)] flex flex-col" aria-label="Bài viết đã xuất bản">
          <HomePostList archiveMonth={archive} page={page} sort={sort} />
        </section>
        <HomeSidebar />
      </div>
    </PageContainer>
  )
}

async function HomeSidebar() {
  const { archives, categories, recentPosts } = await getCachedSidebarData()

  return (
    <Sidebar
      archives={archives}
      categories={categories}
      newsletter={<NewsletterForm />}
      recentPosts={recentPosts}
    />
  )
}
