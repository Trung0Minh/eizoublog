import type { JSONContent } from "@tiptap/react"

function isEmptyBoundaryParagraph(node: JSONContent) {
  if (node.type !== "paragraph") return false

  return !(node.content ?? []).some((child) => {
    if (child.type === "text") return Boolean(child.text?.trim())
    return child.type !== "hardBreak"
  })
}

export function trimRichTextBoundaries(content: JSONContent): JSONContent {
  if (content.type !== "doc" || !content.content?.length) return content

  let start = 0
  let end = content.content.length

  while (start < end && isEmptyBoundaryParagraph(content.content[start])) {
    start += 1
  }

  while (end > start && isEmptyBoundaryParagraph(content.content[end - 1])) {
    end -= 1
  }

  if (start === 0 && end === content.content.length) return content

  return { ...content, content: content.content.slice(start, end) }
}
