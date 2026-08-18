import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

test("writer can delete and type in italic text", async ({ page }) => {
  await loginAsWriter(page)

  const post = await createPost(page.request, {
    content: {
      content: [
        {
          content: [
            {
              marks: [{ type: "italic" }],
              text: "Leaning",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    },
    contentText: "Leaning",
    status: "DRAFT",
    title: `Italic editor ${Date.now()}`,
  })

  await page.goto(`/dashboard/edit/${post.id}`)

  const editor = page.locator(".ProseMirror")
  const italicText = editor.locator("em")
  await expect(italicText).toHaveText("Leaning")

  await italicText.click()
  await page.keyboard.press("Backspace")
  await expect(editor).not.toHaveText("Leaning")

  await page.keyboard.type("X")
  await expect(editor).toContainText("X")
})
