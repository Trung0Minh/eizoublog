import { expect, test, type Page } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

async function revealNavbar(page: Page) {
  // The homepage's hover listener attaches after hydration.
  await expect(async () => {
    await page.mouse.move(20, 120)
    await page.mouse.move(20, 20)
    await expect(page.getByRole("banner")).toBeInViewport()
  }).toPass({ timeout: 10000 })
}

test.describe("Search flow", () => {
  test("desktop command menu shows matching results", async ({
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
    await revealNavbar(page)
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/search") &&
        response.request().method() === "GET",
    )
    await page.getByRole("banner").getByRole("button", { name: "Tìm kiếm bài viết" }).click()
    await page.getByPlaceholder("Tìm kiếm bài viết hoặc danh mục...").fill(term)
    await responsePromise

    await expect(
      page.getByRole("option", { name: new RegExp(title) }),
    ).toBeVisible()
  })

  test("desktop command menu opens advanced search", async ({
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
    await revealNavbar(page)
    await page.getByRole("banner").getByRole("button", { name: "Tìm kiếm bài viết" }).click()
    await page.getByRole("option", { name: "Tìm kiếm nâng cao" }).click()
    await expect(page).toHaveURL(/\/search$/, { timeout: 15000 })
    await page.getByPlaceholder("Nhập từ khóa tìm kiếm...").fill(term)
    await page.getByPlaceholder("Nhập từ khóa tìm kiếm...").press("Enter")

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
