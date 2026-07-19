import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("notFound")
  }),
  prisma: {
    post: {
      findUnique: vi.fn(),
    },
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  session: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}))
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/components/posts/PostHero", () => ({
  PostHero: ({ post }: { post: { title: string } }) => (
    <h1>{post.title}</h1>
  ),
}))
vi.mock("@/components/posts/PostBody", () => ({
  PostBody: ({ content }: { content: { content?: { text?: string }[] } }) => (
    <div>{content.content?.[0]?.text}</div>
  ),
}))
vi.mock("@/components/posts/TableOfContents", () => ({
  TableOfContents: () => <div>toc</div>,
}))
vi.mock("@/components/posts/PostArticleView", () => ({
  PostArticleView: ({
    content,
    post,
  }: {
    content: { content?: { text?: string }[] }
    post: { title: string }
  }) => (
    <div data-testid="post-article-view">
      <h1>{post.title}</h1>
      <div>{content.content?.[0]?.text}</div>
    </div>
  ),
}))

import DashboardPostPreviewPage from "@/app/(writer)/dashboard/preview/[id]/page"

const post = {
  _count: { comments: 0 },
  author: {
    avatarUrl: null,
    bio: null,
    id: "writer-1",
    name: "Writer",
    username: "writer",
  },
  authorId: "writer-1",
  category: null,
  coAuthors: [],
  content: {
    content: [{ text: "Draft body", type: "text" }],
    type: "doc",
  },
  coverAlt: null,
  coverUrl: null,
  draftVisibility: "PRIVATE",
  excerpt: null,
  id: "post-1",
  publishedAt: null,
  slug: "draft-post",
  status: "DRAFT",
  tags: [],
  title: "Draft preview",
  updatedAt: new Date("2026-06-17T00:00:00.000Z"),
}

describe("DashboardPostPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue(post)
  })

  it("renders a private draft post in read-only mode for admins", async () => {
    render(
      await DashboardPostPreviewPage({
        params: Promise.resolve({ id: "post-1" }),
      }),
    )

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Draft\s*preview/i)
    expect(screen.getByText("Draft body")).toBeVisible()
    expect(screen.getByTestId("post-article-view")).toBeVisible()
  })

  it("hides drafts from unrelated writers", async () => {
    mocks.session.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })

    await expect(
      DashboardPostPreviewPage({
        params: Promise.resolve({ id: "post-1" }),
      }),
    ).rejects.toThrow("notFound")
  })
})
