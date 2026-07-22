import type { JSONContent } from "@tiptap/react"

export const EDITOR_TEXT_COLORS = [
  { color: "#dc2626", label: "red" },
  { color: "#ea580c", label: "orange" },
  { color: "#ca8a04", label: "amber" },
  { color: "#16a34a", label: "green" },
  { color: "#0891b2", label: "cyan" },
  { color: "#2563eb", label: "blue" },
  { color: "#7c3aed", label: "violet" },
  { color: "#db2777", label: "pink" },
]

const allowedTextColors = new Set(
  EDITOR_TEXT_COLORS.map(({ color }) => color.toLowerCase()),
)

function sanitizeMarks(marks: JSONContent["marks"]): JSONContent["marks"] {
  const nextMarks = marks
    ?.map((mark) => {
      if (mark.type !== "textStyle") {
        return mark
      }

      const color =
        typeof mark.attrs?.color === "string"
          ? mark.attrs.color.toLowerCase()
          : undefined

      if (!color || allowedTextColors.has(color)) {
        return mark
      }

      const attrs = Object.fromEntries(
        Object.entries(mark.attrs ?? {}).filter(([name]) => name !== "color"),
      )
      return Object.keys(attrs).length > 0 ? { ...mark, attrs } : null
    })
    .filter((mark): mark is NonNullable<JSONContent["marks"]>[number] =>
      Boolean(mark),
    )

  return nextMarks && nextMarks.length > 0 ? nextMarks : undefined
}

export function normalizeEditorContent(node: JSONContent): JSONContent {
  return {
    ...node,
    type: node.type === "image" ? "customImage" : node.type,
    marks: sanitizeMarks(node.marks),
    content: node.content?.map(normalizeEditorContent),
  }
}

export function stripPastedTextColors(html: string) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
  }

  const document = new DOMParser().parseFromString(html, "text/html")
  document.body.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
    element.style.removeProperty("color")

    if (!element.getAttribute("style")?.trim()) {
      element.removeAttribute("style")
    }
  })

  return document.body.innerHTML
}
