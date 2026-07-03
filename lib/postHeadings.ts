import type { JSONContent } from "@tiptap/react"

import { generateSlug } from "@/lib/utils"

export interface PostHeading {
  id: string
  level: number
  text: string
}

function getText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  return node.content?.map(getText).join("") ?? ""
}

export function extractHeadings(content: JSONContent): PostHeading[] {
  const headings: PostHeading[] = []

  function walk(node: JSONContent) {
    if (node.type === "heading") {
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2
      const text = getText(node).trim()

      if (text) {
        headings.push({ id: generateSlug(text), level, text })
      }
    }

    node.content?.forEach(walk)
  }

  walk(content)
  return headings
}
