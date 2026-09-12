import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

const publicPages = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "contributors", path: "/contributors" },
  { name: "search", path: "/search" },
  { name: "unsubscribe", path: "/unsubscribe" },
]

const layoutWidths = [
  { height: 812, label: "mobile", width: 390 },
  { height: 1024, label: "tablet", width: 768 },
  { height: 900, label: "125% zoom on 1440px", width: 1152 },
  { height: 900, label: "100% zoom on 1440px", width: 1440 },
  { height: 900, label: "80% zoom on 1440px", width: 1800 },
  { height: 1080, label: "1920px desktop", width: 1920 },
]

test.describe("public layout width and zoom behavior", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The layout matrix controls viewport sizes directly.",
    )
  })

  for (const publicPage of publicPages) {
    for (const viewport of layoutWidths) {
      test(`${publicPage.name} has no horizontal overflow at ${viewport.label}`, async ({
        page,
      }) => {
        await page.setViewportSize({
          height: viewport.height,
          width: viewport.width,
        })
        await page.goto(publicPage.path, { waitUntil: "domcontentloaded" })
        await expect(page.locator("body")).toBeVisible()

        const metrics = await page.evaluate(() => {
          const root = document.documentElement
          const body = document.body

          return {
            clientWidth: root.clientWidth,
            scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
          }
        })

        expect(
          metrics.scrollWidth,
          `${publicPage.path} overflowed at ${viewport.label}`,
        ).toBeLessThanOrEqual(metrics.clientWidth + 2)
      })
    }
  }

  test("post detail centers article body and comments", async ({ page }) => {
    await loginAsWriter(page)
    const post = await createPost(page.request, {
      contentText: "Article layout verification.",
      title: `Layout verification ${Date.now()}`,
    })
    await page.context().clearCookies()
    await page.setViewportSize({ height: 1000, width: 1440 })
    await page.goto(`/${post.slug}`, { waitUntil: "domcontentloaded" })
    await expect(page.locator("article.post-content")).toBeVisible()
    await expect(page.locator("#comments")).toBeVisible()

    const metrics = await page.evaluate(() => {
      const viewportCenter = document.documentElement.clientWidth / 2
      const postContent = document.querySelector(".post-content")
      const comments = document.querySelector("#comments")

      if (!postContent || !comments) {
        throw new Error("Missing post content or comments")
      }

      const postRect = postContent.getBoundingClientRect()
      const commentRect = comments.getBoundingClientRect()

      return {
        commentCenter: commentRect.left + commentRect.width / 2,
        commentWidth: commentRect.width,
        postCenter: postRect.left + postRect.width / 2,
        postWidth: postRect.width,
        viewportCenter,
      }
    })

    expect(metrics.postWidth).toBeGreaterThan(700)
    expect(Math.abs(metrics.postCenter - metrics.viewportCenter)).toBeLessThan(
      8,
    )
    expect(metrics.commentWidth).toBe(metrics.postWidth)
    expect(
      Math.abs(metrics.commentCenter - metrics.viewportCenter),
    ).toBeLessThan(8)
  })
})
