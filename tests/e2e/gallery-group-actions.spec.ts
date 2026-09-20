import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { mockArticleImages } from "./helpers/media"
import { createPost } from "./helpers/posts"

test("writer can remove one group and ungroup another", async ({ page }) => {
  await mockArticleImages(page)
  await loginAsWriter(page)
  const images = ["First", "Second"].map((alt) => ({
    alt, caption: alt, showCaption: true, url: `https://cdn.example.com/${alt}.webp`,
  }))
  const post = await createPost(page.request, {
    title: `Group actions ${Date.now()}`,
    status: "DRAFT",
    contentText: "Surrounding text",
    content: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Surrounding text" }] },
        ...["grid", "horizontal"].map((layout) => ({
          type: "imageGallery", attrs: { images: JSON.stringify(images), layout },
        })),
      ],
    },
  })
  await page.goto(`/dashboard/edit/${post.id}`)
  const groups = page.locator('.ProseMirror [data-type="image-gallery"]')
  await expect(groups).toHaveCount(2)
  await groups.first().hover()
  await groups.first().getByRole("button", { name: "Remove group", exact: true }).click()
  await expect(groups).toHaveCount(1)
  await groups.first().hover()
  await groups.first().getByRole("button", { name: "Ungroup", exact: true }).click()
  await expect(groups).toHaveCount(0)
  await expect(page.locator(".ProseMirror img")).toHaveCount(2)
  await expect(page.locator(".ProseMirror img").nth(0)).toHaveAttribute("src", images[0].url)
  await expect(page.locator(".ProseMirror img").nth(1)).toHaveAttribute("src", images[1].url)
  await expect(page.locator(".ProseMirror")).toContainText("Surrounding text")
})
