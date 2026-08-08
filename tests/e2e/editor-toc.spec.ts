import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"

test("writer can navigate the live editor outline", async ({ page }, testInfo) => {
  await loginAsWriter(page)

  if (!testInfo.project.use.isMobile) {
    await page.setViewportSize({ height: 900, width: 1600 })
  }

  await page.goto("/dashboard/new")
  await page.locator(".ProseMirror").nth(1).waitFor()
  await page.getByRole("textbox", { name: "Tiêu đề" }).fill("Editor TOC check")

  const bodyEditor = page.locator(".ProseMirror").nth(1)
  await bodyEditor.click()
  await page.getByRole("button", { name: "Heading 2" }).click()
  await page.keyboard.type("Opening movement")
  await page.keyboard.press("Enter")
  await page.keyboard.type("A short paragraph between outline entries.")
  await page.keyboard.press("Enter")
  await page.getByRole("button", { name: "Heading 3" }).click()
  await page.keyboard.type("Timing details")

  if (testInfo.project.use.isMobile) {
    const toggle = page.getByRole("button", { name: "Mục lục bài viết" })
    await expect(toggle).toBeVisible()
    await toggle.click()
  } else {
    const outline = page.getByRole("navigation", {
      name: "Điều hướng bài viết",
    })
    await expect(outline).toBeVisible()

    const outlineBox = await outline.boundingBox()
    const actionRailBox = await page
      .getByTestId("editor-action-rail")
      .boundingBox()
    expect(outlineBox).not.toBeNull()
    expect(actionRailBox).not.toBeNull()
    expect(outlineBox!.x).toBeGreaterThanOrEqual(
      actionRailBox!.x + actionRailBox!.width,
    )
  }

  await page.getByRole("button", { name: "Opening movement" }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const heading = document
          .querySelectorAll(".ProseMirror")[1]
          ?.querySelector("h2")
        const selection = window.getSelection()

        return Boolean(
          heading && selection && heading.contains(selection.anchorNode),
        )
      }),
    )
    .toBe(true)

  const viewportWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  )
  const pageWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  )
  expect(pageWidth).toBe(viewportWidth)
})
