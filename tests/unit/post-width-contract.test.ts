import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("published post width contract", () => {
  it("keeps the hero and article column aligned at the wider shared width", () => {
    const hero = read("components/posts/PostHero.tsx")
    const page = read("app/(public)/[slug]/page.tsx")

    expect(hero).toContain("max-w-[1000px]")
    expect(page).toContain('<main className="w-full max-w-[1000px]')
    expect(page).toContain('<article className="mt-6 md:mt-12 w-full')
    expect(page).toContain('<div className="w-full mx-auto font-lora')
  })

  it("keeps the table of contents beside the same widened article column", () => {
    const page = read("app/(public)/[slug]/page.tsx")
    const articleIndex = page.indexOf('max-w-[1000px]')

    expect(articleIndex).toBeGreaterThan(-1)
    expect(articleIndex).toBeLessThan(
      page.indexOf("{hasTableOfContents && ("),
    )
    expect(page).toContain('aside className="hidden w-[200px]')
  })

  it("uses a horizontally discoverable author strip when cards overflow", () => {
    const page = read("app/(public)/[slug]/page.tsx")

    expect(page).toContain('data-testid="author-credit-list"')
    expect(page).toContain("overflow-x-auto")
    expect(page).toContain("scroll-snap-type")
    expect(page).toContain("Kéo ngang để xem thêm")
  })
})
