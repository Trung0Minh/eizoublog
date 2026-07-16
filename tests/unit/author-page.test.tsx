import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedAuthorByUsername: vi.fn(),
  getCachedAuthorPosts: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }))
vi.mock("@/components/posts/PostList", () => ({
  PostList: () => <div data-testid="post-list" />,
}))
vi.mock("@/components/posts/CompactPostList", () => ({
  CompactPostList: ({ posts }: { posts: { slug: string }[] }) => (
    <div data-count={posts.length} data-testid="compact-post-list" />
  ),
}))
vi.mock("@/components/posts/StaticPostContent", () => ({
  StaticPostContent: () => <div data-testid="static-post-content" />,
}))
vi.mock("@/lib/queries", () => ({
  getCachedAuthorByUsername: mocks.getCachedAuthorByUsername,
  getCachedAuthorPosts: mocks.getCachedAuthorPosts,
}))
vi.mock("@/components/ui/ScrollReveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock("@/components/ui/TextReveal", () => ({
  TextReveal: ({ text }: { text: string }) => <>{text}</>,
}))

import AuthorPage from "@/app/(public)/authors/[username]/page"

describe("AuthorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCachedAuthorPosts.mockResolvedValue({ posts: [], total: 0 })
    class MockIntersectionObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    global.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver
  })

  it("shows only an uppercase ADMIN badge for admin profiles", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: "trùm sò",
      displayRoleColor: "#475569",
      displayRoleName: "Editor-in-Chief",
      id: "admin-1",
      name: "nun",
      role: "ADMIN",
      username: "admin",
    })

    render(
      await AuthorPage({
        params: Promise.resolve({ username: "admin" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(screen.getByText("ADMIN")).toBeVisible()
    expect(screen.getByText("Editor-in-Chief")).toBeVisible()
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
    expect(screen.queryByText("Writer")).not.toBeInTheDocument()
  })

  it("shows only a Writer badge for writer profiles", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: "writer bio",
      displayRoleColor: "#C2410C",
      displayRoleName: "Seasonal Analyst",
      id: "writer-1",
      name: "Mina",
      role: "WRITER",
      username: "mina",
    })

    render(
      await AuthorPage({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(screen.getByText("Seasonal Analyst")).toBeVisible()
    expect(screen.queryByText("ADMIN")).not.toBeInTheDocument()
  })

  it("passes shared post sorting through to the author post query", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: null,
      id: "writer-1",
      name: "Mina",
      role: "WRITER",
      username: "mina",
    })

    render(
      await AuthorPage({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({ page: "2", sort: "comments" }),
      }),
    )

    expect(mocks.getCachedAuthorPosts).toHaveBeenCalledWith(
      "mina",
      2,
      10,
      "comments",
    )
  })

  it("uses the compact profile post list instead of homepage cards", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: null,
      id: "writer-1",
      name: "Mina",
      role: "WRITER",
      username: "mina",
    })
    mocks.getCachedAuthorPosts.mockResolvedValue({
      posts: [
        {
          _count: { comments: 3 },
          author: { avatarUrl: null, name: "Mina", username: "mina" },
          category: null,
          coAuthors: [],
          coverAlt: null,
          coverUrl: null,
          excerpt: null,
          publishedAt: new Date("2026-06-17T00:00:00Z"),
          slug: "compact-post",
          tags: [],
          title: "Compact Post",
        },
      ],
      total: 1,
    })

    render(
      await AuthorPage({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(screen.getByTestId("compact-post-list")).toHaveAttribute(
      "data-count",
      "1",
    )
    expect(screen.queryByTestId("post-list")).not.toBeInTheDocument()
  })
})
