import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedPublishedPost: vi.fn(),
  postFindMany: vi.fn(),
  postFindUnique: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: mocks.postFindMany,
      findUnique: mocks.postFindUnique,
    },
  },
}))
vi.mock("@/lib/queries", () => ({
  getCachedPublishedPost: mocks.getCachedPublishedPost,
}))
vi.mock("@/components/posts/PostJsonLd", () => ({
  PostJsonLd: () => <script data-testid="post-json-ld" />,
}))
vi.mock("@/components/posts/PostHero", () => ({
  PostHero: ({ post }: { post: { title: string } }) => <h1>{post.title}</h1>,
}))
vi.mock("@/components/posts/PostBody", () => ({
  PostBody: () => <div>Post body</div>,
}))
vi.mock("@/components/comments/CommentSection", () => ({
  CommentSection: ({ postSlug }: { postSlug: string }) => (
    <div data-testid="comment-section">{postSlug}</div>
  ),
}))
vi.mock("@/components/posts/TableOfContents", () => ({
  TableOfContents: () => <nav>Table of contents</nav>,
}))
vi.mock("@/components/posts/PostReadTracker", () => ({
  PostReadTracker: ({ slug, title }: { slug: string; title: string }) => (
    <div data-testid="post-read-tracker">
      {slug}:{title}
    </div>
  ),
}))

import PostPage, { generateStaticParams } from "@/app/(public)/[slug]/page"

describe("PostPage analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("mounts the read tracker and passes the slug to comments", async () => {
    mocks.getCachedPublishedPost.mockResolvedValue({
      _count: { comments: 0 },
      author: { avatarUrl: null, bio: null, name: "Mina", username: "mina" },
      category: null,
      coAuthors: [],
      comments: [],
      content: { content: [], type: "doc" },
      coverAlt: null,
      coverUrl: null,
      excerpt: "A close read.",
      id: "post-1",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      slug: "frieren-memory",
      tags: [],
      title: "Frieren and memory",
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    })

    render(
      await PostPage({
        params: Promise.resolve({ slug: "frieren-memory" }),
      }),
    )

    expect(screen.getByTestId("post-read-tracker")).toHaveTextContent(
      "frieren-memory:Frieren and memory",
    )
    expect(screen.getByTestId("comment-section")).toHaveTextContent(
      "frieren-memory",
    )
  })

  it("skips static slug generation outside production", async () => {
    vi.stubEnv("NODE_ENV", "development")

    await expect(generateStaticParams()).resolves.toEqual([])
    expect(mocks.postFindMany).not.toHaveBeenCalled()
  })

  it("pre-renders the latest published post slugs in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    mocks.postFindMany.mockResolvedValue([
      { slug: "frieren-memory" },
      { slug: "layout-of-silence" },
    ])

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "frieren-memory" },
      { slug: "layout-of-silence" },
    ])
    expect(mocks.postFindMany).toHaveBeenCalledWith({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: { slug: true },
      take: 20,
      where: { status: "PUBLISHED" },
    })
  })
})
