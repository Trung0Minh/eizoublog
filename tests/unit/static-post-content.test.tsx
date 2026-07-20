import { render, screen } from "@testing-library/react"
import type { JSONContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { StaticPostContent } from "@/components/posts/StaticPostContent"

describe("StaticPostContent", () => {
  it("renders repeated headings with the same unique IDs used by the TOC", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
        {
          attrs: { level: 3 },
          content: [{ text: "ĐỀ CỬ DANH DỰ", type: "text" }],
          type: "heading",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    expect(
      Array.from(container.querySelectorAll("h3"), (heading) => heading.id),
    ).toEqual([
      "de-cu-danh-du",
      "de-cu-danh-du-2",
      "de-cu-danh-du-3",
    ])
  })

  it("makes inserted links visually identifiable", () => {
    const content: JSONContent = {
      content: [
        {
          content: [
            {
              marks: [{ attrs: { href: "https://example.com" }, type: "link" }],
              text: "Visit the reference",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)
    const link = screen.getByRole("link", { name: "Visit the reference" })

    expect(container.querySelector(".ProseMirror")).toContainElement(link)
    expect(link).toHaveClass(
      "font-semibold",
      "text-accent",
      "underline",
      "underline-offset-[3px]",
      "hover:bg-accent/10",
    )
  })

  it("ignores saved text colors in public rendering", () => {
    const content: JSONContent = {
      content: [
        {
          content: [
            {
              marks: [{ attrs: { color: "#dc2626" }, type: "textStyle" }],
              text: "Intentional red text",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    const colored = screen.getByText("Intentional red text")

    expect(colored.tagName).toBe("P")
    expect(colored).not.toHaveAttribute("style")
    expect(colored.querySelector(".post-text-color")).toBeNull()
  })

  it("ignores pasted white text colors in public rendering", () => {
    const content: JSONContent = {
      content: [
        {
          content: [
            {
              marks: [
                {
                  attrs: { color: "rgb(255, 255, 255)" },
                  type: "textStyle",
                },
              ],
              text: "Pasted white text",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    const colored = screen.getByText("Pasted white text")

    expect(colored.tagName).toBe("P")
    expect(colored).not.toHaveAttribute("style")
    expect(colored.querySelector(".post-text-color")).toBeNull()
  })

  it("ignores oklab colors saved by browser selection", () => {
    const content: JSONContent = {
      content: [
        {
          content: [
            {
              marks: [
                {
                  attrs: {
                    color: "oklab(0.964355 0.000418752 -0.00125641)",
                  },
                  type: "textStyle",
                },
              ],
              text: "Pasted oklab text",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    const colored = screen.getByText("Pasted oklab text")

    expect(colored.tagName).toBe("P")
    expect(colored).not.toHaveAttribute("style")
    expect(colored.querySelector(".post-text-color")).toBeNull()
  })

  it("renders horizontal galleries as a scrollable media list", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              { alt: "Frame A", caption: "", url: "https://cdn.example.com/a.webp" },
              { alt: "Frame B", caption: "", url: "https://cdn.example.com/b.webp" },
            ]),
            layout: "horizontal",
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    expect(container.querySelector(".image-gallery__horizontal")).not.toBeNull()
    expect(screen.getAllByRole("img")).toHaveLength(2)
  })

  it("hides single image captions when caption visibility is disabled", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            showCaption: false,
            src: "https://cdn.example.com/frame.webp",
          },
          content: [{ text: "Hidden memory caption", type: "text" }],
          type: "customImage",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/frame.webp",
    )
    expect(screen.queryByText("Hidden memory caption")).not.toBeInTheDocument()
  })

  it("hides gallery captions when caption visibility is disabled", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              {
                alt: "",
                caption: "Hidden gallery caption",
                showCaption: false,
                url: "https://cdn.example.com/gallery.webp",
              },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/gallery.webp",
    )
    expect(screen.queryByText("Hidden gallery caption")).not.toBeInTheDocument()
  })

  it("reserves caption slots across mixed-caption gallery rows", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              {
                alt: "Captionless frame",
                caption: "",
                showCaption: false,
                url: "https://cdn.example.com/captionless.mp4",
              },
              {
                alt: "Captioned frame",
                caption: "Visible gallery caption",
                showCaption: true,
                url: "https://cdn.example.com/captioned.webm",
              },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    const captions = container.querySelectorAll(".image-gallery__caption")
    expect(captions).toHaveLength(2)
    expect(captions[0]).toHaveAttribute("aria-hidden", "true")
    expect(captions[0]).toHaveTextContent("")
    expect(captions[1]).toHaveTextContent("Visible gallery caption")
  })

  it("hides video captions when caption visibility is disabled", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            caption: "Hidden video caption",
            showCaption: false,
            url: "https://youtu.be/dQw4w9WgXcQ",
          },
          type: "videoEmbed",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByTitle("Hidden video caption")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
    expect(screen.queryByText("Hidden video caption")).not.toBeInTheDocument()
  })

  it("lets native videos use their intrinsic aspect ratio", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: { url: "https://cdn.example.com/portrait.mp4" },
          type: "videoEmbed",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)
    const video = screen.getByTitle("Embedded video")

    expect(video).toHaveClass("h-auto", "w-full")
    expect(video).not.toHaveClass("object-contain", "absolute")
    expect(container.querySelector(".aspect-video")).toBeNull()
  })

  it("keeps legacy captions visible when caption visibility is not stored", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            src: "https://cdn.example.com/legacy.webp",
          },
          content: [{ text: "Legacy caption", type: "text" }],
          type: "customImage",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByText("Legacy caption")).toBeInTheDocument()
  })
})
