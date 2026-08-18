import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

test("writer can add a line break to an image caption", async ({ page }) => {
  await loginAsWriter(page)

  const post = await createPost(page.request, {
    content: {
      content: [
        {
          attrs: {
            showCaption: true,
            src: "https://cdn.example.com/editor-frame.webp",
          },
          content: [{ text: "First line", type: "text" }],
          type: "customImage",
        },
      ],
      type: "doc",
    },
    contentText: "First line",
    status: "DRAFT",
    title: `Image caption ${Date.now()}`,
  })

  await page.goto(`/dashboard/edit/${post.id}`)

  const caption = page.locator(".ProseMirror .editor-media-caption")
  await expect(caption).toHaveText("First line")

  await caption.click()
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await page.keyboard.type("Second line")

  await expect(caption).toHaveText("First line\nSecond line")
})
