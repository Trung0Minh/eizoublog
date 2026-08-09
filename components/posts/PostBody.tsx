import type { JSONContent } from "@tiptap/react"

import { PostImageInteractions } from "@/components/posts/PostImageInteractions"
import { StaticPostContent } from "@/components/posts/StaticPostContent"

interface PostBodyProps {
  content: JSONContent
  contentClassName?: string
  presentation?: "article" | "embedded"
}

export function PostBody({
  content,
  contentClassName,
  presentation = "embedded",
}: PostBodyProps) {
  return (
    <PostImageInteractions className={contentClassName}>
      <StaticPostContent content={content} presentation={presentation} />
    </PostImageInteractions>
  )
}
