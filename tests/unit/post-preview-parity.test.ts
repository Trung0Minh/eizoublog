import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("saved post preview parity", () => {
  it("uses the same article presentation as the published post page", () => {
    const previewPage = read("app/(writer)/dashboard/preview/[id]/page.tsx")
    const publicPage = read("app/(public)/[slug]/page.tsx")

    expect(previewPage).toContain("<PostArticleView")
    expect(publicPage).toContain("<PostArticleView")
    expect(previewPage).not.toContain("<PostHero")
    expect(previewPage).not.toContain("<PostBody")
  })

  it("loads stored event snapshots for the published event renderer", () => {
    const queries = read("lib/queries.ts")

    expect(queries).toContain("submittedContent: true")
    expect(queries).toContain("submittedPostId: true")
    expect(queries).toContain("submittedPostTitle: true")
    expect(queries).not.toContain("submittedWriterIntro: true")
  })
})
