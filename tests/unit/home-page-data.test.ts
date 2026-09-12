import { beforeEach, describe, expect, it, vi } from "vitest"

const queries = vi.hoisted(() => ({ list: vi.fn(), sidebar: vi.fn(), carousel: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: unknown[]) => unknown, keys: string[]) => {
    if (keys[0] === "published-posts-with-event-contributors") return queries.list
    if (keys[0] === "sidebar-data") return queries.sidebar
    if (keys[0] === "home-carousel-posts-with-event-contributors") return queries.carousel
    return callback
  },
}))

import { getHomePageData } from "@/lib/queries"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

describe("getHomePageData", () => {
  beforeEach(() => vi.clearAllMocks())

  it("starts all three reads before any resolves and preserves the assembled result", async () => {
    const list = deferred<{ posts: string[]; total: number }>()
    const sidebar = deferred<{ categories: string[] }>()
    const carousel = deferred<string[]>()
    queries.list.mockReturnValue(list.promise)
    queries.sidebar.mockReturnValue(sidebar.promise)
    queries.carousel.mockReturnValue(carousel.promise)

    const result = getHomePageData({ page: 2, sort: "oldest", archive: "2026-09" })
    expect(queries.list).toHaveBeenCalledWith(2, 10, "oldest", "2026-09")
    expect(queries.sidebar).toHaveBeenCalledOnce()
    expect(queries.carousel).toHaveBeenCalledOnce()

    list.resolve({ posts: ["essay"], total: 11 })
    carousel.resolve(["featured"])
    sidebar.resolve({ categories: ["analysis"] })
    await expect(result).resolves.toEqual({
      listData: { posts: ["essay"], total: 11 },
      sidebarData: { categories: ["analysis"] },
      carouselPosts: ["featured"],
    })
  })
})
