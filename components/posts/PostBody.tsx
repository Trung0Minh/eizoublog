import type { JSONContent } from "@tiptap/react"

import { PostImageInteractions } from "@/components/posts/PostImageInteractions"
import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { trimRichTextBoundaries } from "@/lib/richTextBoundaries"

interface PostBodyProps {
  content: JSONContent
}

export function PostBody({ content }: PostBodyProps) {
  const trimmedContent = trimRichTextBoundaries(content)

  return (
    <PostImageInteractions>
      <StaticPostContent content={trimmedContent} />
    </PostImageInteractions>
  )
}
