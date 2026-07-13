import { render, screen } from "@testing-library/react"
import type { JSONContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { StaticPostContent } from "@/components/posts/StaticPostContent"

describe("StaticPostContent", () => {
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
