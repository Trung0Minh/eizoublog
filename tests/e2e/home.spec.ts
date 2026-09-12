import { expect, test } from "@playwright/test"

test("shows the editorial publication foundation", async ({ page }) => {
  await page.goto("/")

  const title = page.locator("[data-home-intro] h1")
  await expect(title).toBeVisible()
  await expect(title).toHaveText(process.env.NEXT_PUBLIC_APP_NAME || "Anime Blog")
  await expect(page.getByRole("banner").getByRole("link").first()).toHaveAttribute(
    "href",
    "/",
  )
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
})
