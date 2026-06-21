import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedCategoryBySlug: vi.fn(),
  getCachedCategoryPosts: vi.fn(),
  getCachedTagBySlug: vi.fn(),
  getCachedTagPosts: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }))
vi.mock("@/components/posts/PostList", () => ({
  PostList: () => <div data-testid="post-list" />,
}))
vi.mock("@/lib/queries", () => ({
  getCachedCategoryBySlug: mocks.getCachedCategoryBySlug,
  getCachedCategoryPosts: mocks.getCachedCategoryPosts,
  getCachedTagBySlug: mocks.getCachedTagBySlug,
  getCachedTagPosts: mocks.getCachedTagPosts,
}))

import CategoryPage from "@/app/(public)/category/[slug]/page"
import TagPage from "@/app/(public)/tag/[slug]/page"

describe("taxonomy pages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCachedCategoryPosts.mockResolvedValue({ posts: [], total: 0 })
    mocks.getCachedTagPosts.mockResolvedValue({ posts: [], total: 0 })
  })

  it("passes shared post sorting through to category post queries", async () => {
    mocks.getCachedCategoryBySlug.mockResolvedValue({
      children: [{ id: "child-1" }],
      description: null,
      id: "category-1",
      name: "Production",
      slug: "production",
    })

    render(
      await CategoryPage({
        params: Promise.resolve({ slug: "production" }),
        searchParams: Promise.resolve({ page: "2", sort: "oldest" }),
      }),
    )

    expect(mocks.getCachedCategoryPosts).toHaveBeenCalledWith(
      "production",
      2,
      10,
      "oldest",
    )
  })

  it("passes shared post sorting through to tag post queries", async () => {
    mocks.getCachedTagBySlug.mockResolvedValue({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })

    render(
      await TagPage({
        params: Promise.resolve({ slug: "sakuga" }),
        searchParams: Promise.resolve({ sort: "comments" }),
      }),
    )

    expect(mocks.getCachedTagPosts).toHaveBeenCalledWith(
      "sakuga",
      1,
      10,
      "comments",
    )
  })
})
