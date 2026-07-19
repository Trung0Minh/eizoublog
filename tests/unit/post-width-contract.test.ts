import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("published post width contract", () => {
  it("keeps the hero and article column aligned at the wider shared width", () => {
    const hero = read("components/posts/PostHero.tsx")
    const articleView = read("components/posts/PostArticleView.tsx")

    expect(hero).toContain("max-w-[1000px]")
    expect(articleView).toContain('className="w-full max-w-[1000px]')
    expect(articleView).toContain('className="post-content mx-auto mt-6')
    expect(articleView).toContain('className="mx-auto w-full font-lora')
  })

  it("keeps the table of contents beside the same widened article column", () => {
    const articleView = read("components/posts/PostArticleView.tsx")
    const articleIndex = articleView.indexOf('max-w-[1000px]')

    expect(articleIndex).toBeGreaterThan(-1)
    expect(articleIndex).toBeLessThan(
      articleView.indexOf("{hasTableOfContents && ("),
    )
    expect(articleView).toContain('aside className="sticky top-24')
  })

  it("uses a horizontally discoverable author strip when cards overflow", () => {
    const articleView = read("components/posts/PostArticleView.tsx")
    const authorCredits = read("components/posts/AuthorCreditList.tsx")

    expect(articleView).toContain("<AuthorCreditList")
    expect(authorCredits).toContain('data-testid="author-credit-list"')
    expect(authorCredits).toContain("overflow-x-auto")
    expect(authorCredits).toContain("scroll-snap-type")
    expect(authorCredits).toContain("Kéo ngang để xem thêm")
  })

  it("aligns event comments with the event article column", () => {
    const publicPage = read("app/(public)/[slug]/page.tsx")

    expect(publicPage).toContain('data-testid="event-comments"')
    expect(publicPage).toContain("lg:grid-cols-[minmax(0,1000px)]")
    expect(publicPage).toContain("2xl:pl-20")
  })
})
