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

export function normalizePostHeadingIds(content: JSONContent): JSONContent {
  const occurrences = new Map<string, number>()

  function transform(node: JSONContent): JSONContent {
    const transformedContent = node.content?.map(transform)

    if (node.type !== "heading") {
      return {
        ...node,
        ...(transformedContent && { content: transformedContent }),
      }
    }

    const transformedNode = {
      ...node,
      ...(transformedContent && { content: transformedContent }),
    }
    const text = getText(transformedNode).trim()
    const storedId =
      typeof node.attrs?.id === "string" ? node.attrs.id.trim() : ""
    const baseId = storedId || generateSlug(text)
    const occurrence = text && baseId
      ? (occurrences.get(baseId) ?? 0) + 1
      : 0

    if (occurrence > 0) {
      occurrences.set(baseId, occurrence)
    }

    return {
      ...transformedNode,
      attrs: {
        ...node.attrs,
        id:
          occurrence === 0
            ? undefined
            : occurrence === 1
              ? baseId
              : `${baseId}-${occurrence}`,
      },
    }
  }

  return transform(content)
}

export function extractHeadings(content: JSONContent): PostHeading[] {
  const headings: PostHeading[] = []

  function walk(node: JSONContent) {
    if (node.type === "heading") {
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2
      const text = getText(node).trim()
      const id = typeof node.attrs?.id === "string" ? node.attrs.id : ""

      if (text && id) {
        headings.push({ id, level, text })
      }
    }

    node.content?.forEach(walk)
  }

  walk(normalizePostHeadingIds(content))
  return headings
}
