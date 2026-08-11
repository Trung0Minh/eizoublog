import type { ReactNode } from "react"

import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { getCachedPublishedPosts } from "@/lib/queries"
import type { PostListSort } from "@/lib/postListSort"

const PAGE_SIZE = 10
type HomePostListData = Awaited<ReturnType<typeof getCachedPublishedPosts>>

export async function HomePostList({
  archiveMonth,
  data,
  page,
  sidebar,
  sort,
}: {
  archiveMonth?: string
  data?: HomePostListData
  page: number
  sidebar?: ReactNode
  sort: PostListSort
}) {
  const { posts, total } =
    data ?? (await getCachedPublishedPosts(page, PAGE_SIZE, sort, archiveMonth))

  return (
    <div
      className="grid scroll-mt-24 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-x-12"
      id="post-list"
    >
      <div className="lg:col-start-1 lg:row-start-1">
        {archiveMonth && (
          <h1 className="mb-4 text-2xl font-bold">
            Bài viết {formatArchiveHeading(archiveMonth)}
          </h1>
        )}
        <div className="mb-6 flex justify-start gap-4 border-b pb-4">
          <PostSortTabs
            basePath="/"
            query={{ archive: archiveMonth }}
            sort={sort}
          />
        </div>
      </div>

      <div
        className="lg:col-start-1 lg:row-start-2"
        data-testid="home-post-feed"
      >
        <PostList
          emptyMessage="Chưa có bài viết nào được xuất bản."
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            query: {
              archive: archiveMonth,
              sort: sort === "latest" ? undefined : sort,
            },
            total,
          }}
          posts={posts}
        />
      </div>

      {sidebar && (
        <div
          className="mt-8 lg:col-start-2 lg:row-start-2 lg:mt-0"
          data-testid="home-sidebar-slot"
        >
          {sidebar}
        </div>
      )}
    </div>
  )
}

function formatArchiveHeading(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  const [yearPart, monthPart] = month.split("-")
  const monthNumber = Number(monthPart)

  if (monthNumber < 1 || monthNumber > 12) {
    return month
  }

  return `${monthPart}/${yearPart}`
}
