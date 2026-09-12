import { describe, expect, it } from "vitest"

import { pickPostHeroData } from "@/lib/postHero"

describe("article hero client data", () => {
  it("keeps display and action data while excluding article records and extra nested fields", () => {
    const author = { name: "Writer", username: "writer", avatarUrl: null, bio: "Full biography", email: "private@example.com" }
    const post = {
      id: "post-id", title: "Title", slug: "title", status: "PUBLISHED" as const,
      coverUrl: "https://cdn.example.com/cover.webp?cw=50", coverAlt: "Frame",
      excerpt: "Summary", excerptContent: { type: "doc", content: [] },
      publishedAt: new Date("2026-09-01"), featuredAt: new Date("2026-09-02"),
      author, coAuthors: [{ user: author, invitationToken: "private" }],
      category: { name: "Animation", slug: "animation", id: "category-id" },
      tags: [{ tag: { name: "Timing", slug: "timing", id: "tag-id" } }],
      _count: { comments: 3, revisions: 9 },
      content: { type: "doc", content: [{ type: "text", text: "Long article" }] },
      contentText: "Long article", comments: [{ content: "Private record" }],
    }

    const hero = pickPostHeroData(post)
    expect(hero).toEqual({
      id: post.id, title: post.title, slug: post.slug, status: post.status,
      coverUrl: post.coverUrl, coverAlt: post.coverAlt,
      excerpt: post.excerpt, excerptContent: post.excerptContent,
      publishedAt: post.publishedAt, featuredAt: post.featuredAt,
      author: { name: "Writer", username: "writer", avatarUrl: null },
      coAuthors: [{ user: { name: "Writer", username: "writer", avatarUrl: null } }],
      category: { name: "Animation", slug: "animation" },
      tags: [{ tag: { name: "Timing", slug: "timing" } }],
      _count: { comments: 3 },
    })
    expect(post.author.bio).toBe("Full biography")
    expect(post.contentText).toBe("Long article")
  })
})
