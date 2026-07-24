import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("getHomePageData", () => {
  it("loads the post list, sidebar data, and carousel posts together", () => {
    const source = readFileSync(join(process.cwd(), "lib/queries.ts"), "utf8")

    expect(source).toContain(
      'const listDataPromise = getCachedPublishedPosts(page, 10, sort, archive)',
    )
    expect(source).toContain("const sidebarDataPromise = getCachedSidebarData()")
    expect(source).toContain(
      "const carouselPostsPromise = getCachedHomeCarouselPosts()",
    )
    expect(source).toContain(
      "const [listData, sidebarData, carouselPosts] = await Promise.all([",
    )
  })
})
