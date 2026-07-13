import { describe, expect, it } from "vitest"
import type { JSONContent } from "@tiptap/react"

import {
  buildAwardEventOutline,
  buildAwardEventPostContent,
  emptyAwardEventDoc,
  namespaceAwardEventPostContent,
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
          writerIntro: "Cuts that stayed in my head.",
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
          writerIntro: "I watched too many endings.",
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
          writerIntro: "No post yet.",
        },
      ],
    })

    expect(JSON.stringify(content)).toContain("No submitted entries yet.")
    expect(JSON.stringify(content)).not.toContain("Empty")
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
        writerIntro: null,
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
        writerIntro: null,
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
  it("assigns collision-safe room-prefixed ids and demotes headings below the writer", () => {
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
      ),
      "room-a",
    )

    expect(content.content?.map((node) => node.attrs)).toEqual([
      { id: "event-room-room-a-introduction", level: 3 },
      { id: "event-room-room-a-introduction-2", level: 3 },
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
})
