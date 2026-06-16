import { describe, expect, it } from "vitest"
import type { JSONContent } from "@tiptap/react"

import {
  buildAwardEventPostContent,
  shuffleAwardEventRooms,
} from "@/lib/awardEvents"

const paragraph = (text: string): JSONContent => ({
  content: [{ text, type: "text" }],
  type: "paragraph",
})

const doc = (...content: JSONContent[]): JSONContent => ({
  content,
  type: "doc",
})

describe("buildAwardEventPostContent", () => {
  it("builds one public article from submitted rooms in saved order", () => {
    const content = buildAwardEventPostContent({
      eventIntro: doc(paragraph("A noisy year-end table of personal picks.")),
      rooms: [
        {
          content: doc(paragraph("Mai pick body")),
          id: "room-2",
          order: 2,
          status: "SUBMITTED",
          writer: { name: "Mai", username: "mai" },
          writerIntro: "Cuts that stayed in my head.",
        },
        {
          content: doc(paragraph("An pick body")),
          id: "room-1",
          order: 1,
          status: "SUBMITTED",
          writer: { name: "An", username: "an" },
          writerIntro: "I watched too many endings.",
        },
        {
          content: doc(paragraph("Draft body")),
          id: "room-3",
          order: 3,
          status: "DRAFT",
          writer: { name: "Draft", username: "draft" },
          writerIntro: "Not ready.",
        },
      ],
    })

    expect(content.content?.map((node) => node.type)).toEqual([
      "paragraph",
      "heading",
      "bulletList",
      "heading",
      "blockquote",
      "paragraph",
      "heading",
      "blockquote",
      "paragraph",
    ])
    expect(JSON.stringify(content)).toContain("Entries")
    expect(JSON.stringify(content)).toContain("An")
    expect(JSON.stringify(content)).toContain("Mai")
    expect(JSON.stringify(content)).not.toContain("Draft")
    expect(JSON.stringify(content).indexOf("An")).toBeLessThan(
      JSON.stringify(content).indexOf("Mai"),
    )
  })
})

describe("shuffleAwardEventRooms", () => {
  it("returns the same room ids with new contiguous order values", () => {
    const shuffled = shuffleAwardEventRooms([
      { id: "a", order: 0 },
      { id: "b", order: 1 },
      { id: "c", order: 2 },
    ], () => 0.5)

    expect(shuffled.map((room) => room.id).sort()).toEqual(["a", "b", "c"])
    expect(shuffled.map((room) => room.order)).toEqual([0, 1, 2])
    expect(shuffled.map((room) => room.id)).toEqual(["a", "c", "b"])
  })
})
