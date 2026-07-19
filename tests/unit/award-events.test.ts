import { describe, expect, it } from "vitest"
import type { JSONContent } from "@tiptap/react"

import {
  buildAwardEventOutline,
  buildAwardEventPostContent,
  emptyAwardEventDoc,
  namespaceAwardEventPostContent,
  reorderAwardEventRooms,
  shuffleAwardEventRooms,
  shuffleSubmittedAwardEventRooms,
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
  it("uses a Tiptap-valid empty document for new event rooms", () => {
    expect(emptyAwardEventDoc).toEqual({
      content: [{ type: "paragraph" }],
      type: "doc",
    })
  })

  it("builds one public article from submitted rooms in saved order", () => {
    const content = buildAwardEventPostContent({
      eventIntro: doc(paragraph("A noisy year-end table of personal picks.")),
      rooms: [
        {
          id: "room-2",
          order: 2,
          selectedPost: {
            content: doc(paragraph("Mai pick body")),
            id: "post-2",
            status: "PUBLISHED",
            title: "Mai selections",
          },
          status: "SUBMITTED",
          writer: { name: "Mai", username: "mai" },
        },
        {
          id: "room-1",
          order: 1,
          selectedPost: {
            content: doc(paragraph("An pick body")),
            id: "post-1",
            status: "DRAFT",
            title: "An selections",
          },
          status: "SUBMITTED",
          writer: { name: "An", username: "an" },
        },
        {
          id: "room-3",
          order: 3,
          selectedPost: {
            content: doc(paragraph("Draft body")),
            id: "post-3",
            status: "DRAFT",
            title: "Draft selections",
          },
          status: "DRAFT",
          writer: { name: "Draft", username: "draft" },
        },
      ],
    })

    expect(content.content?.map((node) => node.type)).toEqual([
      "paragraph",
      "heading",
      "bulletList",
      "heading",
      "paragraph",
      "heading",
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

  it("ignores submitted rooms without a selected post", () => {
    const content = buildAwardEventPostContent({
      eventIntro: null,
      rooms: [
        {
          id: "room-1",
          order: 1,
          selectedPost: null,
          status: "SUBMITTED",
          writer: { name: "Empty", username: "empty" },
        },
      ],
    })

    expect(JSON.stringify(content)).toContain("No submitted entries yet.")
    expect(JSON.stringify(content)).not.toContain("Empty")
  })

  it("ignores submitted rooms whose source post was removed", () => {
    const content = buildAwardEventPostContent({
      eventIntro: null,
      rooms: [
        {
          id: "room-removed",
          order: 1,
          selectedPost: {
            content: doc(paragraph("Removed body")),
            id: "post-removed",
            status: "REMOVED",
            title: "Removed entry",
          },
          status: "SUBMITTED",
          writer: { name: "Removed Writer", username: "removed-writer" },
        },
      ],
    })

    expect(JSON.stringify(content)).toContain("No submitted entries yet.")
    expect(JSON.stringify(content)).not.toContain("Removed Writer")
    expect(JSON.stringify(content)).not.toContain("Removed body")
  })
})

describe("buildAwardEventOutline", () => {
  it("places writers above namespaced headings from their submitted posts", () => {
    const outline = buildAwardEventOutline([
      {
        id: "room-a",
        order: 0,
        selectedPost: {
          content: doc({
            attrs: { level: 2 },
            content: [{ text: "Introduction", type: "text" }],
            type: "heading",
          }),
          id: "post-a",
          status: "DRAFT",
          title: "A",
        },
        status: "SUBMITTED",
        writer: { name: "Writer A", username: "writer-a" },
      },
      {
        id: "room-b",
        order: 1,
        selectedPost: {
          content: doc({
            attrs: { level: 3 },
            content: [{ text: "Introduction", type: "text" }],
            type: "heading",
          }),
          id: "post-b",
          status: "PUBLISHED",
          title: "B",
        },
        status: "SUBMITTED",
        writer: { name: "Writer B", username: "writer-b" },
      },
    ])

    expect(outline).toEqual([
      { id: "event-room-room-a", level: 1, text: "Writer A" },
      { id: "event-room-room-a-introduction", level: 2, text: "Introduction" },
      { id: "event-room-room-b", level: 1, text: "Writer B" },
      { id: "event-room-room-b-introduction", level: 3, text: "Introduction" },
    ])
  })
})

describe("namespaceAwardEventPostContent", () => {
  it("assigns collision-safe room-prefixed ids and preserves heading levels", () => {
    const content = namespaceAwardEventPostContent(
      doc(
        {
          attrs: { level: 2 },
          content: [{ text: "Introduction", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 2 },
          content: [{ text: "Introduction", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 4 },
          content: [{ text: "Follow-up", type: "text" }],
          type: "heading",
        },
      ),
      "room-a",
    )

    expect(content.content?.map((node) => node.attrs)).toEqual([
      { id: "event-room-room-a-introduction", level: 2 },
      { id: "event-room-room-a-introduction-2", level: 2 },
      { id: "event-room-room-a-follow-up", level: 4 },
    ])
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

  it("rotates rooms when randomization would keep the original order", () => {
    const shuffled = shuffleAwardEventRooms(
      [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
      ],
      () => 0.99,
    )

    expect(shuffled.map((room) => room.id)).toEqual(["b", "a"])
  })
})

describe("shuffleSubmittedAwardEventRooms", () => {
  it("shuffles eligible submissions while keeping drafts and exclusions after them", () => {
    const shuffled = shuffleSubmittedAwardEventRooms(
      [
        { excludedAt: null, id: "a", order: 0, status: "SUBMITTED" as const },
        { excludedAt: null, id: "draft", order: 1, status: "DRAFT" as const },
        { excludedAt: null, id: "b", order: 2, status: "SUBMITTED" as const },
        { excludedAt: new Date("2026-01-01"), id: "excluded", order: 3, status: "SUBMITTED" as const },
      ],
      () => 0.99,
    )

    expect(shuffled.map((room) => room.id)).toEqual(["b", "a", "draft", "excluded"])
    expect(shuffled.map((room) => room.order)).toEqual([0, 1, 2, 3])
  })
})

describe("reorderAwardEventRooms", () => {
  it("moves a room to the hovered position and normalizes all orders", () => {
    const reordered = reorderAwardEventRooms(
      [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
        { id: "c", order: 2 },
      ],
      "a",
      "c",
    )

    expect(reordered).toEqual([
      { id: "b", order: 0 },
      { id: "c", order: 1 },
      { id: "a", order: 2 },
    ])
  })
})
