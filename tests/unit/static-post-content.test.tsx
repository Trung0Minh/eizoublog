import { render, screen } from "@testing-library/react"
import type { JSONContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { StaticPostContent } from "@/components/posts/StaticPostContent"

describe("StaticPostContent", () => {
  it("preserves line breaks in standard image captions", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            showCaption: true,
            src: "https://cdn.example.com/frame.webp",
          },
          content: [
            { text: "First line", type: "text" },
            { type: "hardBreak" },
            { text: "Second line", type: "text" },
          ],
          type: "customImage",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)
    const caption = container.querySelector(".media-caption")

    expect(caption?.querySelector("br")).toBeInTheDocument()
  })

  it("renders links in standard image captions", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            showCaption: true,
            src: "https://cdn.example.com/frame.webp",
          },
          content: [
            {
              marks: [{ attrs: { href: "https://example.com" }, type: "link" }],
              text: "Reference",
              type: "text",
            },
          ],
          type: "customImage",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByRole("link", { name: "Reference" })).toHaveAttribute(
      "href",
      "https://example.com",
    )
  })

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

    const headings = Array.from(container.querySelectorAll("h3"))

    expect(headings.map((heading) => heading.id)).toEqual([
      "de-cu-danh-du",
      "de-cu-danh-du-2",
      "de-cu-danh-du-3",
    ])
    headings.forEach((heading) => expect(heading).toHaveClass("scroll-mt-24"))
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

  it("marks intentional blank paragraphs for scoped spacing fixes", () => {
    const content: JSONContent = {
      content: [
        {
          content: [{ text: "Before the pause.", type: "text" }],
          type: "paragraph",
        },
        { type: "paragraph" },
        {
          content: [{ text: "After the pause.", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    expect(container.querySelector('p[data-empty="true"]')).toContainHTML("<br")
    expect(screen.getByText("Before the pause.")).toBeVisible()
    expect(screen.getByText("After the pause.")).toBeVisible()
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

  it("keeps grid gallery images grouped in their source rows", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            columns: 2,
            images: JSON.stringify([
              { alt: "Frame A", caption: "", url: "https://cdn.example.com/a.webp" },
              { alt: "Frame B", caption: "", url: "https://cdn.example.com/b.webp" },
              { alt: "Frame C", caption: "", url: "https://cdn.example.com/c.webp" },
              { alt: "Frame D", caption: "", url: "https://cdn.example.com/d.webp" },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)
    const rows = container.querySelectorAll(".image-gallery__grid-row")

    expect(rows).toHaveLength(2)
    expect(rows[0]?.querySelectorAll(".image-gallery__item")).toHaveLength(2)
    expect(rows[1]?.querySelectorAll(".image-gallery__item")).toHaveLength(2)
  })

  it("renders a visible gallery-level caption", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            caption: "Frames from the opening sequence",
            images: JSON.stringify([
              { alt: "Frame A", caption: "", url: "https://cdn.example.com/a.webp" },
              { alt: "Frame B", caption: "", url: "https://cdn.example.com/b.webp" },
            ]),
            showCaption: true,
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByText("Frames from the opening sequence")).toHaveClass("image-gallery__gallery-caption")
  })

  it("renders one-image galleries as normal single images", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              {
                alt: "Only frame",
                caption: "Single image caption",
                showCaption: true,
                url: "https://cdn.example.com/only-frame.webp",
              },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    expect(container.querySelector(".image-gallery")).toBeNull()
    expect(container.querySelector('figure[data-type="image"]')).not.toBeNull()
    expect(screen.getByRole("img", { name: "Only frame" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/only-frame.webp",
    )
    expect(screen.getByText("Single image caption")).toBeInTheDocument()
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

  it("applies saved rotation and flip transforms to single images", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            alt: "Transformed frame",
            flipX: true,
            flipY: true,
            naturalHeight: 900,
            naturalWidth: 600,
            rotation: 270,
            src: "https://cdn.example.com/transformed.webp",
          },
          type: "customImage",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    const image = screen.getByRole("img", { name: "Transformed frame" })

    expect(image.parentElement).toHaveStyle({
      aspectRatio: "900 / 600",
    })
    expect(image.parentElement).toHaveStyle({ overflow: "hidden" })
    expect(image).toHaveStyle({
      transform: "rotate(270deg) scale(-0.6666666666666666, -0.6666666666666666)",
      transformOrigin: "center",
    })
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

  it("aligns only the siblings of a captioned gallery item", () => {
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
    expect(captions[1]).toHaveTextContent("Visible gallery caption")
  })

  it("does not reserve caption space when every gallery caption is blank", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              { alt: "Frame one", caption: "   ", showCaption: true, url: "https://cdn.example.com/one.webp" },
              { alt: "Frame two", caption: "", showCaption: true, url: "https://cdn.example.com/two.webp" },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    const { container } = render(<StaticPostContent content={content} />)

    expect(container.querySelectorAll(".image-gallery__caption")).toHaveLength(0)
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

  it("reserves a stable fallback aspect ratio for legacy native videos", () => {
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

    expect(video).toHaveClass("absolute", "object-contain")
    expect(video.parentElement).toHaveAttribute("data-native-video-frame")
    expect(video.parentElement).toHaveStyle({ aspectRatio: "16 / 9" })
    expect(container.querySelector(".aspect-video")).toBeNull()
  })

  it("uses saved native-video dimensions before metadata loads", () => {
    const content: JSONContent = {
      content: [
        {
          attrs: {
            naturalHeight: 1080,
            naturalWidth: 1920,
            url: "https://cdn.example.com/landscape.mp4",
          },
          type: "videoEmbed",
        },
      ],
      type: "doc",
    }

    render(<StaticPostContent content={content} />)

    expect(screen.getByTitle("Embedded video").parentElement).toHaveStyle({
      aspectRatio: "1920 / 1080",
    })
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
