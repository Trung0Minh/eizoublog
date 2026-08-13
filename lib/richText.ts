import type { JSONContent } from "@tiptap/react"

function getRichTextNodeText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? ""
  if (node.type === "hardBreak") return "\n"

  const childText = node.content?.map(getRichTextNodeText) ?? []

  if (
    node.type === "doc" ||
    node.type === "bulletList" ||
    node.type === "orderedList"
  ) {
    return childText.filter(Boolean).join("\n")
  }

  return childText.join("")
}

export function richTextJsonToPlainText(value: string) {
  if (!value.startsWith("{")) return value

  try {
    return getRichTextNodeText(JSON.parse(value) as JSONContent)
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  } catch {
    return value
  }
}
