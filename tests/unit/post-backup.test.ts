import { describe, expect, it } from "vitest"

import { parsePostBackup } from "@/lib/postBackup"

const content = { content: [{ type: "paragraph" }], type: "doc" }

describe("parsePostBackup", () => {
  it("normalizes a saved post export", () => {
    expect(
      parsePostBackup({
        data: {
          formatVersion: 1,
          post: {
            category: { id: "category-id", slug: "reviews" },
            content,
            contentText: "Body",
            coverAlt: "Cover",
            coverUrl: "https://cdn.example.com/cover.jpg",
            excerpt: "Excerpt",
            excerptContent: content,
            tags: [{ tag: { id: "tag-id", slug: "sakuga" } }],
            title: "Saved post",
          },
        },
      }),
    ).toEqual({
      category: { id: "category-id", slug: "reviews" },
      content,
      contentText: "Body",
      coverAlt: "Cover",
      coverUrl: "https://cdn.example.com/cover.jpg",
      excerpt: "Excerpt",
      excerptContent: content,
      tags: [{ id: "tag-id", slug: "sakuga" }],
      title: "Saved post",
    })
  })

  it("normalizes an unsaved local recovery export", () => {
    expect(
      parsePostBackup({
        data: {
          formatVersion: 1,
          post: {
            categoryId: "category-id",
            content,
            contentText: "Body",
            tags: [{ id: "tag-id", name: "Animation", slug: "animation" }],
            title: "  ",
          },
        },
      }),
    ).toMatchObject({
      category: { id: "category-id" },
      tags: [{ id: "tag-id", slug: "animation" }],
      title: null,
    })
  })

  it("rejects unknown versions and malformed backups", () => {
    expect(() =>
      parsePostBackup({ data: { formatVersion: 2, post: { content } } }),
    ).toThrow()
    expect(() => parsePostBackup({ data: { formatVersion: 1 } })).toThrow()
  })
})
