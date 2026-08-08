import type { JSONContent } from "@tiptap/react"

import { PostImageInteractions } from "@/components/posts/PostImageInteractions"
import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { trimRichTextBoundaries } from "@/lib/richTextBoundaries"

interface PostBodyProps {
  content: JSONContent
  contentClassName?: string
}

export function PostBody({ content, contentClassName }: PostBodyProps) {
  const trimmedContent = trimRichTextBoundaries(content)

  return (
    <PostImageInteractions className={contentClassName}>
      <StaticPostContent content={trimmedContent} />
    </PostImageInteractions>
  )
}
