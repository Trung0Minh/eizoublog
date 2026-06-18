import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { getCachedPublishedPosts } from "@/lib/queries"
import type { PostListSort } from "@/lib/postListSort"

const PAGE_SIZE = 10

export async function HomePostList({
  archiveMonth,
  page,
  sort,
}: {
  archiveMonth?: string
  page: number
  sort: PostListSort
}) {
  const { posts, total } = await getCachedPublishedPosts(
    page,
    PAGE_SIZE,
    sort,
    archiveMonth,
  )

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          {archiveMonth
            ? `Bài viết ${formatArchiveHeading(archiveMonth)}`
            : "Bài viết đã xuất bản"}
        </h2>
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

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}
