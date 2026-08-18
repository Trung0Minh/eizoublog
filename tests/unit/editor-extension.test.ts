import { Editor } from "@tiptap/core"
import Color from "@tiptap/extension-color"
import StarterKit from "@tiptap/starter-kit"
import TextStyle from "@tiptap/extension-text-style"
import { describe, expect, it } from "vitest"

import {
  CustomImageExtension,
  GalleryExtension,
  HeadingWithIdExtension,
  ListItemExtension,
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

  it("serializes native-video dimensions for stable static rendering", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              naturalHeight: 1080,
              naturalWidth: 1920,
              url: "https://cdn.example.com/scene.mp4",
            },
            type: "videoEmbed",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, VideoEmbedExtension],
    })

    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({
      naturalHeight: 1080,
      naturalWidth: 1920,
    })
    expect(editor.getHTML()).toContain("aspect-ratio: 1920 / 1080")
    editor.destroy()
  })
})

describe("text color extension", () => {
  it("serializes selected text color as a textStyle mark", () => {
    const editor = new Editor({
      content: "Colored text",
      extensions: [StarterKit, TextStyle, Color.configure({ types: [TextStyle.name] })],
    })

    editor.commands.selectAll()
    editor.commands.setColor("#dc2626")

    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            {
              marks: [{ attrs: { color: "#dc2626" }, type: "textStyle" }],
              text: "Colored text",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    })
    expect(editor.getHTML()).toContain('style="color: rgb(220, 38, 38);"')
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

  it("does not serialize custom spoiler label attributes", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              hideLabel: "Close secret",
              showLabel: "Big secret",
            },
            content: [
              {
                content: [{ text: "Major reveal", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "spoiler",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, SpoilerExtension],
    })

    expect(editor.getHTML()).not.toContain("data-show-label")
    expect(editor.getHTML()).not.toContain("data-hide-label")
    editor.destroy()
  })
})

describe("ListItemExtension", () => {
  it("preserves default Enter behavior while adding nested-list shortcuts", () => {
    const editor = new Editor({
      content: "<ul><li><p>First item</p></li></ul>",
      extensions: [StarterKit.configure({ listItem: false }), ListItemExtension],
    })

    editor.commands.focus("end")
    editor.commands.keyboardShortcut("Enter")

    expect(editor.getHTML()).toContain("<li><p>First item</p></li><li><p></p></li>")
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
  it("stores horizontal gallery layout while defaulting legacy galleries to grid", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              images: JSON.stringify([
                { alt: "Frame", caption: "", url: "https://cdn.example.com/frame.webp" },
                { alt: "Frame 2", caption: "", url: "https://cdn.example.com/frame-2.webp" },
              ]),
              layout: "horizontal",
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, GalleryExtension],
    })

    expect(editor.getHTML()).toContain('data-layout="horizontal"')
    expect(editor.getHTML()).toContain("image-gallery__horizontal")
    editor.destroy()
  })

  it("serializes one-image galleries as normal image figures", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              images: JSON.stringify([
                {
                  alt: "Only frame",
                  caption: "Single frame caption",
                  showCaption: true,
                  url: "https://cdn.example.com/only-frame.webp",
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

    expect(html).toContain('data-type="image"')
    expect(html).not.toContain('data-type="image-gallery"')
    expect(html).not.toContain("image-gallery__grid")
    expect(html).toContain('src="https://cdn.example.com/only-frame.webp"')
    expect(html).toContain('alt="Only frame"')
    expect(html).toContain("Single frame caption")
    editor.destroy()
  })

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

  it("serializes a gallery caption and transformed gallery images", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              caption: "Key frames from the chase",
              images: JSON.stringify([
                {
                  alt: "Rotated frame",
                  caption: "",
                  flipX: true,
                  flipY: true,
                  naturalHeight: 800,
                  naturalWidth: 1200,
                  rotation: 90,
                  url: "https://cdn.example.com/rotated.webp",
                },
                { alt: "Second frame", caption: "", url: "https://cdn.example.com/second.webp" },
              ]),
              showCaption: true,
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, GalleryExtension],
    })

    const html = editor.getHTML()

    expect(html).toContain('data-caption="Key frames from the chase"')
    expect(html).toContain("Key frames from the chase")
    expect(html).toContain("rotate(90deg) scale(-1.5, -1.5)")
    editor.destroy()
  })

  it("aligns gallery captions only within their source row", () => {
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

describe("CustomImageExtension", () => {
  it("inserts a hard line break when Enter is pressed in an image caption", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: { src: "https://cdn.example.com/frame.webp" },
            content: [{ text: "First line", type: "text" }],
            type: "customImage",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, CustomImageExtension],
    })

    editor.commands.setTextSelection(6)
    expect(editor.isActive("customImage")).toBe(true)
    editor.commands.keyboardShortcut("Enter")

    expect(editor.getHTML()).toContain("First<br> line")
    editor.destroy()
  })

  it("serializes image rotation and flips", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              alt: "Rotated frame",
              flipX: true,
              flipY: true,
              naturalHeight: 800,
              naturalWidth: 1200,
              rotation: 90,
              src: "https://cdn.example.com/rotated.webp",
            },
            type: "customImage",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, CustomImageExtension],
    })

    const html = editor.getHTML()

    expect(html).toContain('data-rotation="90"')
    expect(html).toContain('data-flip-x="true"')
    expect(html).toContain('data-flip-y="true"')
    expect(html).toContain('data-natural-width="1200"')
    expect(html).toContain('data-natural-height="800"')
    expect(html).toContain("aspect-ratio: 800 / 1200")
    expect(html).toContain("overflow: hidden")
    expect(html).toContain("rotate(90deg) scale(-1.5, -1.5)")
    editor.destroy()
  })
})
