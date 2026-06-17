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
vi.mock("@/components/posts/StaticPostContent", () => ({
  StaticPostContent: () => <div data-testid="static-post-content" />,
}))
vi.mock("@/lib/queries", () => ({
  getCachedAuthorByUsername: mocks.getCachedAuthorByUsername,
  getCachedAuthorPosts: mocks.getCachedAuthorPosts,
}))

import AuthorPage from "@/app/(public)/authors/[username]/page"

describe("AuthorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCachedAuthorPosts.mockResolvedValue({ posts: [], total: 0 })
  })

  it("shows only an uppercase ADMIN badge for admin profiles", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: "trùm sò",
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
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
    expect(screen.queryByText("Writer")).not.toBeInTheDocument()
  })

  it("shows only a Writer badge for writer profiles", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: "writer bio",
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

    expect(screen.getByText("Writer")).toBeVisible()
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
      "writer-1",
      2,
      10,
      "comments",
    )
  })
})
