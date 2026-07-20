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
