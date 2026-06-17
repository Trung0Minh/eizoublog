export type PostListSort = "latest" | "oldest" | "comments"

export const POST_LIST_SORT_OPTIONS: Array<{
  label: string
  value: PostListSort
}> = [
  { value: "latest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "comments", label: "Nhiều bình luận" },
]

export function parsePostListSort(value?: string): PostListSort {
  return value === "oldest" || value === "comments" ? value : "latest"
}
