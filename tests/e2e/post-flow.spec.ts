import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

test.describe("Writer post flow", () => {
  test("writer can open the editor and create a published post", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const title = `E2E Editor Post ${testInfo.project.name} ${Date.now()}`
    const body = "Phase sixteen editor body content."
    const publishedTitle = `E2E Published Post ${testInfo.project.name} ${Date.now()}`

    await page.goto("/dashboard/new")
    await expect(page.getByTestId("post-editor-shell")).toBeVisible()
    await expect(page.getByTestId("editor-writing-surface")).toBeVisible()
    const shellBox = await page.getByTestId("post-editor-shell").boundingBox()
    expect(shellBox?.height).toBeGreaterThanOrEqual(
      page.viewportSize()!.height - 2,
    )
    await expect(page.getByLabel("Danh mục")).toHaveCount(0)
    await page
      .getByRole("button", { name: /^(?:Mở cài đặt|Cài đặt bài viết)$/ })
      .click()
    await expect(
      page.getByRole("button", { name: "Ẩn cài đặt bài viết" }).first(),
    ).toBeVisible()
    await expect(page.getByLabel("Danh mục")).toBeVisible()

    await page.getByRole("textbox", { name: "Tiêu đề" }).fill(title)
    await page.locator(".ProseMirror").fill(body)
    await expect(page.getByRole("textbox", { name: "Tiêu đề" })).toHaveValue(
      title,
    )
    const saveDraftLabel = testInfo.project.use.isMobile ? /^Nháp$/ : /Lưu nháp/
    await expect(
      page.getByRole("button", { name: saveDraftLabel }),
    ).toBeEnabled()

    const publishedPost = await createPost(page.request, {
      contentText: body,
      title: publishedTitle,
    })

    expect(publishedPost.status).toBe("PUBLISHED")
    expect(publishedPost.slug).toContain("e2e-published-post")
  })

  test("draft post is not visible from the public post URL", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const title = `E2E Private Draft ${testInfo.project.name} ${Date.now()}`
    const post = await createPost(page.request, {
      contentText: "Draft-only content.",
      status: "DRAFT",
      title,
    })

    await page.context().clearCookies()
    const response = await page.goto(`/${post.slug}`)

    expect(response?.status()).toBe(404)
  })

  test("reader can open and navigate the post image lightbox", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const post = await createPost(page.request, {
      content: {
        content: [
          {
            attrs: {
              alt: "Opening frame",
              src: "https://cdn.example.com/e2e-frame-a.webp",
            },
            type: "image",
          },
          {
            attrs: {
              images: JSON.stringify([
                {
                  alt: "Motion frame",
                  caption: "Timing comparison",
                  url: "https://cdn.example.com/e2e-frame-b.gif",
                },
              ]),
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      contentText: "A lightbox verification post.",
      title: `E2E Lightbox Post ${testInfo.project.name} ${Date.now()}`,
    })

    await page.context().clearCookies()
    await page.goto(`/${post.slug}`)
    await page.getByRole("img", { name: "Opening frame" }).click()

    const lightbox = page.getByRole("dialog", { name: "Image viewer" })
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByText("1 / 2")).toBeVisible()

    await page.keyboard.press("ArrowRight")

    await expect(lightbox.getByRole("img", { name: "Motion frame" })).toBeVisible()
    await expect(lightbox.getByText("Timing comparison")).toBeVisible()

    await lightbox.getByRole("button", { name: "Zoom in" }).click()
    await page.keyboard.press("Escape")

    await expect(lightbox).toBeHidden()
  })

  test("editor loads legacy image nodes without dropping the document", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const post = await createPost(page.request, {
      content: {
        content: [
          {
            attrs: {
              alt: "Legacy opening frame",
              src: "https://cdn.example.com/legacy-frame.webp",
            },
            type: "image",
          },
          {
            content: [{ text: "Text after legacy image.", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      contentText: "Text after legacy image.",
      status: "DRAFT",
      title: `E2E Legacy Image ${testInfo.project.name} ${Date.now()}`,
    })

    await page.goto(`/dashboard/edit/${post.id}`)

    await expect(page.getByTestId("editor-writing-surface")).toBeVisible()
    await expect(page.locator(".ProseMirror")).toContainText(
      "Text after legacy image.",
    )
    await expect(
      page.getByRole("img", { name: "Legacy opening frame" }),
    ).toBeVisible()
  })
})
