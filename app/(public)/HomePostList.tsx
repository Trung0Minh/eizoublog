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
  sort,
}: {
  archiveMonth?: string
  data?: HomePostListData
  page: number
  sort: PostListSort
}) {
  const { posts, total } =
    data ?? (await getCachedPublishedPosts(page, PAGE_SIZE, sort, archiveMonth))

  return (
    <div className="flex scroll-mt-24 flex-col" id="post-list">
      {archiveMonth && (
        <h1 className="text-2xl font-bold mb-4">
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

      <PostList
        emptyMessage="Chưa có bài viết nào được xuất bản."
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          query: { archive: archiveMonth, sort: sort === "latest" ? undefined : sort },
          total,
        }}
        posts={posts}
      />
    </div>
  )
}

function formatArchiveHeading(month: string) {
  const [yearPart, monthPart] = month.split("-")
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1))

  if (Number.isNaN(date.getTime())) {
    return month
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}
