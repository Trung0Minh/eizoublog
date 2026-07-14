import type { JSONContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { extractHeadings } from "@/lib/postHeadings"

describe("extractHeadings", () => {
  it("assigns deterministic unique IDs to repeated headings and ignores empty ones", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: "BEST OPENING", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
      ],
      type: "doc",
    }

    expect(extractHeadings(content).map(({ id }) => id)).toEqual([
      "best-opening",
      "de-cu-danh-du",
      "de-cu-danh-du-2",
      "de-cu-danh-du-3",
    ])
  })
})
