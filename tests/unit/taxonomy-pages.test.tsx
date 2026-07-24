import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedCategoryBySlug: vi.fn(),
  getCachedCategoryPosts: vi.fn(),
  getCachedPublicArchives: vi.fn(),
  getCachedPublicCategories: vi.fn(),
  getCachedPublicComments: vi.fn(),
  getCachedPublishedPosts: vi.fn(),
  getCachedTagBySlug: vi.fn(),
  getCachedTagPosts: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock("@/components/posts/PostList", () => ({
  PostList: () => <div data-testid="post-list" />,
}))
vi.mock("@/lib/queries", () => ({
  getCachedCategoryBySlug: mocks.getCachedCategoryBySlug,
  getCachedCategoryPosts: mocks.getCachedCategoryPosts,
  getCachedPublicArchives: mocks.getCachedPublicArchives,
  getCachedPublicCategories: mocks.getCachedPublicCategories,
  getCachedPublicComments: mocks.getCachedPublicComments,
  getCachedPublishedPosts: mocks.getCachedPublishedPosts,
  getCachedTagBySlug: mocks.getCachedTagBySlug,
  getCachedTagPosts: mocks.getCachedTagPosts,
}))

import ArchiveIndexPage from "@/app/(public)/archive/page"
import CategoryPage from "@/app/(public)/category/[slug]/page"
import CategoryIndexPage from "@/app/(public)/category/page"
import CommentsPage from "@/app/(public)/comments/page"
import ArchivePage from "@/app/(public)/archive/[month]/page"
import TagPage from "@/app/(public)/tag/[slug]/page"

describe("taxonomy pages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCachedCategoryPosts.mockResolvedValue({ posts: [], total: 0 })
    mocks.getCachedPublicArchives.mockResolvedValue([])
    mocks.getCachedPublicCategories.mockResolvedValue([])
    mocks.getCachedPublicComments.mockResolvedValue({ comments: [], total: 0 })
    mocks.getCachedPublishedPosts.mockResolvedValue({ posts: [], total: 0 })
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

  it("renders archive months as dedicated sortable listing pages", async () => {
    render(
      await ArchivePage({
        params: Promise.resolve({ month: "2026-07" }),
        searchParams: Promise.resolve({ page: "2", sort: "comments" }),
      }),
    )

    expect(mocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      2,
      10,
      "comments",
      "2026-07",
    )
  })

  it("renders the public category index with links to all categories", async () => {
    mocks.getCachedPublicCategories.mockResolvedValue([
      { count: 2, name: "Production", slug: "production" },
    ])

    render(await CategoryIndexPage())

    expect(screen.getByRole("link", { name: /Production/ })).toHaveAttribute(
      "href",
      "/category/production",
    )
  })

  it("renders the public archive index with links to all archive months", async () => {
    mocks.getCachedPublicArchives.mockResolvedValue([
      { count: 3, month: "2026-07" },
    ])

    render(await ArchiveIndexPage())

    expect(screen.getByRole("link", { name: /07\/2026/ })).toHaveAttribute(
      "href",
      "/archive/2026-07",
    )
  })

  it("renders the public comments index with direct comment links", async () => {
    mocks.getCachedPublicComments.mockResolvedValue({
      comments: [
        {
          authorName: "Mina",
          content: "A recent comment",
          createdAt: new Date("2026-07-01T00:00:00Z"),
          id: "comment-1",
          post: { slug: "essay", title: "Essay" },
        },
      ],
      total: 1,
    })

    render(
      await CommentsPage({
        searchParams: Promise.resolve({ page: "2" }),
      }),
    )

    expect(mocks.getCachedPublicComments).toHaveBeenCalledWith(2, 10)
    expect(screen.getByRole("link", { name: "A recent comment" })).toHaveAttribute(
      "href",
      "/essay#comment-comment-1",
    )
  })
})
