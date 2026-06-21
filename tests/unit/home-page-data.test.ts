import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMocks = vi.hoisted(() => ({
  getCachedPublishedPosts: vi.fn(),
  getCachedSidebarData: vi.fn(),
}))

vi.mock("@/lib/queries", () => ({
  getCachedPublishedPosts: queryMocks.getCachedPublishedPosts,
  getCachedSidebarData: queryMocks.getCachedSidebarData,
}))

vi.mock("@/lib/seo", () => ({
  buildMetadata: vi.fn(),
  getAppUrl: vi.fn(() => "https://example.com"),
}))

import { getHomePageData } from "@/app/(public)/page"

describe("getHomePageData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reuses the default post list for homepage carousel posts", async () => {
    queryMocks.getCachedPublishedPosts.mockResolvedValue({
      posts: Array.from({ length: 10 }, (_, index) => ({
        slug: `post-${index}`,
        title: `Post ${index}`,
      })),
      total: 10,
    })
    queryMocks.getCachedSidebarData.mockResolvedValue({
      archives: [],
      categories: [],
      recentPosts: [],
    })

    await expect(
      getHomePageData({ archive: undefined, page: 1, sort: "latest" }),
    ).resolves.toMatchObject({
      carouselPosts: [
        { slug: "post-0" },
        { slug: "post-1" },
        { slug: "post-2" },
        { slug: "post-3" },
        { slug: "post-4" },
      ],
      listData: { total: 10 },
    })

    expect(queryMocks.getCachedPublishedPosts).toHaveBeenCalledTimes(1)
    expect(queryMocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      1,
      10,
      "latest",
      undefined,
    )
    expect(queryMocks.getCachedSidebarData).toHaveBeenCalledTimes(1)
  })
})
