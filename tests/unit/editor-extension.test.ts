import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { describe, expect, it } from "vitest"

import {
  GalleryExtension,
  HeadingWithIdExtension,
  SpoilerExtension,
  VideoEmbedExtension,
} from "@/components/editor/extensions"

describe("VideoEmbedExtension", () => {
  it("renders a YouTube embed iframe with a caption", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              caption: "Opening sequence",
              url: "https://youtu.be/dQw4w9WgXcQ",
            },
            type: "videoEmbed",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, VideoEmbedExtension],
    })

    expect(editor.getHTML()).toContain(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
    expect(editor.getHTML()).toContain("Opening sequence")
    editor.destroy()
  })
})

describe("SpoilerExtension", () => {
  it("wraps selected block content as a spoiler node", () => {
    const editor = new Editor({
      content: "<p>Major reveal</p>",
      extensions: [StarterKit, SpoilerExtension],
    })

    editor.commands.toggleSpoiler()

    expect(editor.getHTML()).toContain('data-type="spoiler"')
    expect(editor.getHTML()).toContain("Major reveal")
    editor.destroy()
  })
})

describe("HeadingWithIdExtension", () => {
  it("renders heading IDs that match table of contents anchors", () => {
    const editor = new Editor({
      content: "<h2>Đạo diễn tập</h2>",
      extensions: [
        StarterKit.configure({ heading: false }),
        HeadingWithIdExtension,
      ],
    })

    expect(editor.getHTML()).toContain('<h2 id="dao-dien-tap">')
    editor.destroy()
  })
})

describe("GalleryExtension", () => {
  it("renders image galleries with captions and accessible alt text", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              images: JSON.stringify([
                {
                  alt: "Episode frame A",
                  caption: "Before the cut",
                  url: "https://cdn.example.com/frame-a.webp",
                },
                {
                  alt: "",
                  caption: "After the cut",
                  url: "https://cdn.example.com/frame-b.gif",
                },
              ]),
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, GalleryExtension],
    })

    const html = editor.getHTML()

    expect(html).toContain('data-type="image-gallery"')
    expect(html).toContain("image-gallery__grid")
    expect(html).toContain('src="https://cdn.example.com/frame-a.webp"')
    expect(html).toContain('alt="Episode frame A"')
    expect(html).toContain('alt="After the cut"')
    expect(html).toContain("Before the cut")
    expect(html).toContain("After the cut")
    editor.destroy()
  })

  it("reserves gallery caption slots for mixed-caption media", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              images: JSON.stringify([
                {
                  alt: "Captionless clip",
                  caption: "",
                  showCaption: false,
                  url: "https://cdn.example.com/captionless.mp4",
                },
                {
                  alt: "Captioned clip",
                  caption: "Visible clip caption",
                  showCaption: true,
                  url: "https://cdn.example.com/captioned.webm",
                },
              ]),
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, GalleryExtension],
    })

    const html = editor.getHTML()

    expect(html.match(/<figcaption/g)).toHaveLength(2)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain("Visible clip caption")
    editor.destroy()
  })
})
