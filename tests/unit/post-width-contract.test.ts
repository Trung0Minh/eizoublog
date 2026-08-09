import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("published post width contract", () => {
  it("keeps the hero, editor, and article column aligned at the shared width", () => {
    const hero = read("components/posts/PostHero.tsx")
    const articleView = read("components/posts/PostArticleView.tsx")
    const editor = read("components/posts/PostEditor.tsx")

    expect(hero).toContain("max-w-[1440px]")
    expect(hero).toContain("max-w-[1100px]")
    expect(hero).toContain("post-hero-toc-spacer")
    expect(articleView).toContain("hasTableOfContents={hasTableOfContents}")
    expect(articleView).toContain('className="w-full max-w-[1100px]')
    expect(articleView).toContain('className="post-content mx-auto mt-4')
    expect(articleView).toContain('className="mx-auto w-full font-lora')
    expect(articleView).toContain("px-4 md:px-6")
    expect(articleView).toContain("px-3 py-4")
    expect(articleView).toContain("sm:p-8 md:p-12")
    expect(articleView).toContain("rounded-[14px] border border-transparent")
    expect(editor).toContain("max-w-[1100px]")
    expect(editor).toContain("px-4 pb-[120px] pt-6 md:px-6")
    expect(editor).toContain("px-3 py-4 sm:p-8 md:p-12")
  })

  it("keeps the table of contents beside the same widened article column", () => {
    const articleView = read("components/posts/PostArticleView.tsx")
    const articleIndex = articleView.indexOf('max-w-[1100px]')

    expect(articleIndex).toBeGreaterThan(-1)
    expect(articleIndex).toBeLessThan(
      articleView.indexOf("{hasTableOfContents && ("),
    )
    expect(articleView).toContain('aside className="sticky top-24')
    expect(articleView).toContain("2xl:block")
    expect(articleView).not.toMatch(/(?:^|\s)xl:block(?:\s|$)/)
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
