import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("getHomePageData", () => {
  it("reuses the default post list promise for homepage carousel posts", () => {
    const source = readFileSync(join(process.cwd(), "lib/queries.ts"), "utf8")

    expect(source).toContain(
      'const listDataPromise = getCachedPublishedPosts(page, 10, sort, archive)',
    )
    expect(source).toContain('page === 1 && sort === "latest" && !archive')
    expect(source).toContain(
      "listDataPromise.then(({ posts }) => posts.slice(0, 5))",
    )
  })
})
