import { expect, test } from "@playwright/test"

interface NewsletterTokenResponse {
  data?: {
    token: string
  }
  error?: string
}

test.describe("Newsletter flow", () => {
  test("visitor can subscribe to the newsletter", async ({ page }, testInfo) => {
    const email = `newsletter-${testInfo.project.name}-${Date.now()}@example.com`

    await page.goto("/")
    await page.getByRole("textbox", { name: "\u0110\u1ecba ch\u1ec9 email" }).fill(email)
    await page.getByRole("button", { name: "\u0110\u0103ng k\u00fd" }).click()

    await expect(page.getByRole("status")).toHaveText(
      "Subscribed successfully.",
    )
  })

  test("unsubscribe page processes a subscriber token", async ({
    page,
  }, testInfo) => {
    const email = `unsubscribe-${testInfo.project.name}-${Date.now()}@example.com`
    const subscribeResponse = await page.request.post(
      "/api/newsletter/subscribe",
      { data: { email } },
    )
    expect(subscribeResponse.ok()).toBe(true)

    const tokenResponse = await page.request.get(
      `/api/test/newsletter-token?email=${encodeURIComponent(email)}`,
    )
    const payload = (await tokenResponse.json()) as NewsletterTokenResponse
    expect(tokenResponse.ok(), payload.error).toBe(true)

    if (!payload.data) {
      throw new Error("Newsletter token response did not include data")
    }

    await page.goto(`/unsubscribe?token=${payload.data.token}`)

    await expect(
      page.getByRole("heading", { name: "B\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c h\u1ee7y \u0111\u0103ng k\u00fd" }),
    ).toBeVisible()
  })
})
