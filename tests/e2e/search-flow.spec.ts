import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

test.describe("Search flow", () => {
  test("desktop search bar shows inline results", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium",
      "The navbar search bar is replaced by mobile navigation on small screens.",
    )

    await loginAsWriter(page)
    const term = `phase${Date.now()}`
    const title = `E2E Search Result ${term}`
    await createPost(page.request, {
      contentText: `Searchable essay body containing ${term}.`,
      title,
    })
    await page.context().clearCookies()

    await page.goto("/")
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/search") &&
        response.request().method() === "GET",
    )
    await page.getByRole("searchbox", { name: "Tìm kiếm bài viết" }).fill(term)
    await responsePromise

    await expect(
      page.getByRole("banner").getByRole("link", { name: title }),
    ).toBeVisible()
  })

  test("desktop search dropdown navigates to the full search page", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium",
      "The navbar search bar is replaced by mobile navigation on small screens.",
    )

    await loginAsWriter(page)
    const term = `archive${Date.now()}`
    await createPost(page.request, {
      contentText: `Archive navigation body containing ${term}.`,
      title: `E2E Search Navigation ${term}`,
    })
    await page.context().clearCookies()

    await page.goto("/")
    const searchbox = page.getByRole("searchbox", { name: "Tìm kiếm bài viết" })
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/search") &&
        response.request().method() === "GET",
    )
    await searchbox.fill(term)
    await responsePromise
    await page
      .getByRole("banner")
      .getByRole("link", { name: `Xem tất cả kết quả cho "${term}"` })
      .click()

    await expect(page).toHaveURL(new RegExp(`/search\\?q=${term}$`))
    await expect(
      page.getByRole("heading", { level: 1, name: `Kết quả cho "${term}"` }),
    ).toBeVisible()
  })

  test("search page shows no results message for unknown terms", async ({
    page,
  }) => {
    await page.goto("/search?q=xyzunknownterm9999")

    await expect(page.getByText("Không có bài viết nào khớp với tìm kiếm của bạn. Thử ít từ khóa hơn hoặc dùng từ khóa khác.")).toBeVisible()
  })
})
