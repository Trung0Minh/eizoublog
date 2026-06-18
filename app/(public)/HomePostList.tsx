import { PostList } from "@/components/posts/PostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { getCachedPublishedPosts } from "@/lib/queries"
import type { PostListSort } from "@/lib/postListSort"

const PAGE_SIZE = 10

export async function HomePostList({
  page,
  sort,
}: {
  page: number
  sort: PostListSort
}) {
  const { posts, total } = await getCachedPublishedPosts(page, PAGE_SIZE, sort)

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          Bài viết đã xuất bản
        </h2>
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
