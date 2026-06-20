import type { JSONContent } from "@tiptap/react"

export function normalizeEditorContent(node: JSONContent): JSONContent {
  return {
    ...node,
    type: node.type === "image" ? "customImage" : node.type,
    content: node.content?.map(normalizeEditorContent),
  }
}
