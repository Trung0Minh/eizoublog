import type { Page } from "@playwright/test"

export async function mockArticleImages(page: Page) {
  await page.route("https://cdn.example.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#46788a"/></svg>',
    }),
  )
}
