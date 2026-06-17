import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import type { ComponentType } from "react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

interface MockPostImage {
  alt: string
  caption?: string
  src: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readGalleryImages(value: unknown): MockPostImage[] {
  let parsed = value

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.flatMap((item) => {
    if (!isRecord(item) || typeof item.url !== "string") {
      return []
    }

    const caption = typeof item.caption === "string" ? item.caption : undefined
    const alt =
      typeof item.alt === "string" && item.alt.trim() !== ""
        ? item.alt
        : caption ?? ""

    return [{ alt, caption, src: item.url }]
  })
}

function collectImages(node: unknown): MockPostImage[] {
  if (!isRecord(node)) {
    return []
  }

  const images: MockPostImage[] = []
  const attrs = isRecord(node.attrs) ? node.attrs : null

  if (node.type === "image" && attrs && typeof attrs.src === "string") {
    images.push({
      alt: typeof attrs.alt === "string" ? attrs.alt : "",
      src: attrs.src,
    })
  }

  if (node.type === "imageGallery" && attrs) {
    images.push(...readGalleryImages(attrs.images))
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      images.push(...collectImages(child))
    }
  }

  return images
}

vi.mock("@tiptap/react", () => ({
  NodeViewContent: () => <p>Spoiler text</p>,
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    editable,
    content,
  }: {
    content: unknown
    editable: boolean
  }) => (
    <div
      data-content={JSON.stringify(content)}
      data-editable={String(editable)}
      data-testid="tiptap-editor"
    >
      {collectImages(content).map((image) =>
        image.caption ? (
          <figure key={image.src}>
            <img alt={image.alt} src={image.src} />
            <figcaption>{image.caption}</figcaption>
          </figure>
        ) : (
          <img alt={image.alt} key={image.src} src={image.src} />
        ),
      )}
    </div>
  ),
}))

import { MediaUpload } from "@/components/editor/MediaUpload"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { SpoilerView } from "@/components/editor/SpoilerView"
import { toVideoEmbedUrl } from "@/components/editor/extensions/VideoEmbedExtension"
import { VideoEmbedModal } from "@/components/editor/VideoEmbedModal"
import { PostBody } from "@/components/posts/PostBody"
import { useAutosave } from "@/hooks/useAutosave"

describe("toVideoEmbedUrl", () => {
  it("converts YouTube watch and short links to embed URLs", () => {
    expect(
      toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0")
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
  })

  it("passes through non-YouTube URLs", () => {
    expect(toVideoEmbedUrl("https://player.example.com/video")).toBe(
      "https://player.example.com/video",
    )
  })
})

function AutosaveHarness({
  isDirty,
  onSave,
}: {
  isDirty: boolean
  onSave: () => Promise<void>
}) {
  const { save } = useAutosave({ isDirty, onSave, postId: "post-1" })

  return (
    <button onClick={() => void save()} type="button">
      save
    </button>
  )
}

describe("useAutosave", () => {
  it("does not save when the current draft is clean", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(<AutosaveHarness isDirty={false} onSave={onSave} />)
    await user.click(screen.getByRole("button", { name: "save" }))

    expect(onSave).not.toHaveBeenCalled()
  })
})

describe("MediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/content-images/file.gif" },
          }),
          { status: 201 },
        ),
      ),
    )
    vi.spyOn(window, "prompt").mockReturnValue("Episode key visual")
    vi.spyOn(window, "alert").mockImplementation(() => undefined)
  })

  it("uploads a selected image and inserts the returned URL", async () => {
    const user = userEvent.setup()
    const onInsertSingle = vi.fn()
    render(
      <MediaUpload
        onInsertGallery={vi.fn()}
        onInsertSingle={onInsertSingle}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    await user.upload(
      input!,
      new File(["gif"], "scene.gif", { type: "image/gif" }),
    )

    await waitFor(() => {
      expect(onInsertSingle).toHaveBeenCalledWith(
        "https://cdn.example.com/content-images/file.gif",
        "Episode key visual",
      )
    })
    expect(fetch).toHaveBeenCalledWith("/api/upload", {
      body: expect.any(FormData),
      method: "POST",
    })
  })

  it("opens a preview modal for multiple selected images", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            files: [
              { url: "https://cdn.example.com/content-images/scene-a.webp" },
              { url: "https://cdn.example.com/content-images/scene-b.gif" },
            ],
          },
        }),
        { status: 201 },
      ),
    )
    render(
      <MediaUpload
        onInsertGallery={vi.fn()}
        onInsertSingle={vi.fn()}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).toHaveAttribute("multiple")

    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])

    expect(
      await screen.findByRole("dialog", { name: "2 images selected" }),
    ).toBeVisible()
    expect(screen.getByText("scene-a.webp")).toBeVisible()
    expect(screen.getByText("scene-b.gif")).toBeVisible()
    expect(window.prompt).not.toHaveBeenCalled()
  })

  it("can reorder multiple images and insert them as individual blocks", async () => {
    const user = userEvent.setup()
    const onInsertSingle = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            files: [
              { url: "https://cdn.example.com/content-images/scene-a.webp" },
              { url: "https://cdn.example.com/content-images/scene-b.gif" },
            ],
          },
        }),
        { status: 201 },
      ),
    )
    render(
      <MediaUpload
        onInsertGallery={vi.fn()}
        onInsertSingle={onInsertSingle}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])

    const first = await screen.findByLabelText("Selected image scene-a.webp")
    const second = screen.getByLabelText("Selected image scene-b.gif")
    fireEvent.dragStart(first)
    fireEvent.dragOver(second)
    fireEvent.dragEnd(second)

    await user.click(screen.getByRole("button", { name: "Insert 2 images" }))

    expect(onInsertSingle).toHaveBeenNthCalledWith(
      1,
      "https://cdn.example.com/content-images/scene-b.gif",
      "",
    )
    expect(onInsertSingle).toHaveBeenNthCalledWith(
      2,
      "https://cdn.example.com/content-images/scene-a.webp",
      "",
    )
  })

  it("inserts multiple images as a captioned gallery", async () => {
    const user = userEvent.setup()
    const onInsertGallery = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            files: [
              { url: "https://cdn.example.com/content-images/scene-a.webp" },
              { url: "https://cdn.example.com/content-images/scene-b.gif" },
            ],
          },
        }),
        { status: 201 },
      ),
    )
    render(
      <MediaUpload
        onInsertGallery={onInsertGallery}
        onInsertSingle={vi.fn()}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])

    await user.click(
      await screen.findByRole("button", { name: "Insert as gallery grid" }),
    )
    await user.type(
      screen.getByLabelText("Caption for scene-a.webp"),
      "First frame",
    )
    await user.type(
      screen.getByLabelText("Alt text for scene-a.webp"),
      "Character close-up",
    )
    await user.type(
      screen.getByLabelText("Caption for scene-b.gif"),
      "Motion comparison",
    )
    await user.click(screen.getByRole("button", { name: "Insert 2 images" }))

    expect(onInsertGallery).toHaveBeenCalledWith([
      {
        alt: "Character close-up",
        caption: "First frame",
        url: "https://cdn.example.com/content-images/scene-a.webp",
      },
      {
        alt: "",
        caption: "Motion comparison",
        url: "https://cdn.example.com/content-images/scene-b.gif",
      },
    ])
  })
})

describe("EditorToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/content-images/file.gif" },
          }),
          { status: 201 },
        ),
      ),
    )
    vi.spyOn(window, "prompt").mockReturnValue("Episode key visual")
  })

  it("inserts an uploaded image into the editor", async () => {
    const user = userEvent.setup()
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
      setImage: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(
      input!,
      new File(["gif"], "scene.gif", { type: "image/gif" }),
    )

    await waitFor(() => {
      expect(chain.setImage).toHaveBeenCalledWith({
        alt: "Episode key visual",
        src: "https://cdn.example.com/content-images/file.gif",
      })
    })
    expect(chain.run).toHaveBeenCalled()
  })

  it("inserts an uploaded gallery into the editor", async () => {
    const user = userEvent.setup()
    const chain = {
      focus: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run: vi.fn(() => true),
      setImage: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            files: [
              { url: "https://cdn.example.com/content-images/scene-a.webp" },
              { url: "https://cdn.example.com/content-images/scene-b.gif" },
            ],
          },
        }),
        { status: 201 },
      ),
    )

    render(<EditorToolbar editor={editor as never} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])
    await user.click(
      await screen.findByRole("button", { name: "Insert as gallery grid" }),
    )
    await user.click(screen.getByRole("button", { name: "Insert 2 images" }))

    expect(chain.insertContent).toHaveBeenCalledWith({
      attrs: {
        images: JSON.stringify([
          {
            alt: "",
            caption: "",
            url: "https://cdn.example.com/content-images/scene-a.webp",
          },
          {
            alt: "",
            caption: "",
            url: "https://cdn.example.com/content-images/scene-b.gif",
          },
        ]),
      },
      type: "imageGallery",
    })
  })

  it("supports underline and nested list toolbar actions", () => {
    const chain = {
      focus: vi.fn(() => chain),
      liftListItem: vi.fn(() => chain),
      run: vi.fn(() => true),
      sinkListItem: vi.fn(() => chain),
      toggleUnderline: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: "Underline" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Indent list item" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Outdent list item" }))

    expect(chain.toggleUnderline).toHaveBeenCalled()
    expect(chain.sinkListItem).toHaveBeenCalledWith("listItem")
    expect(chain.liftListItem).toHaveBeenCalledWith("listItem")
  })

  it("supports highlight, text alignment, and task list toolbar actions", () => {
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
      setTextAlign: vi.fn(() => chain),
      toggleHighlight: vi.fn(() => chain),
      toggleTaskList: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: "Highlight" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align left" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align center" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align right" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Task list" }))

    expect(chain.toggleHighlight).toHaveBeenCalled()
    expect(chain.setTextAlign).toHaveBeenCalledWith("left")
    expect(chain.setTextAlign).toHaveBeenCalledWith("center")
    expect(chain.setTextAlign).toHaveBeenCalledWith("right")
    expect(chain.toggleTaskList).toHaveBeenCalled()
  })
})

describe("VideoEmbedModal", () => {
  it("submits a trimmed URL and caption", async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    render(<VideoEmbedModal onClose={vi.fn()} onInsert={onInsert} />)

    await user.type(
      screen.getByRole("textbox", { name: /Video URL/ }),
      " https://youtu.be/dQw4w9WgXcQ ",
    )
    await user.type(
      screen.getByRole("textbox", { name: /Caption/ }),
      " Opening sequence ",
    )
    await user.click(screen.getByRole("button", { name: "Insert" }))

    expect(onInsert).toHaveBeenCalledWith(
      "https://youtu.be/dQw4w9WgXcQ",
      "Opening sequence",
    )
  })
})

describe("SpoilerView", () => {
  it("blurs content until the spoiler is revealed", async () => {
    const user = userEvent.setup()
    render(<SpoilerView />)

    const content = screen.getByText("Spoiler text").parentElement
    expect(content).toHaveClass("blur-sm")

    await user.click(screen.getByRole("button", { name: /Show spoiler/ }))

    expect(screen.getByRole("button", { name: /Hide spoiler/ })).toBeVisible()
    expect(content).not.toHaveClass("blur-sm")
  })

  it("keeps reveal button clicks out of parent editor handlers", () => {
    const onClick = vi.fn()
    const onMouseDown = vi.fn()

    render(
      <div onClick={onClick} onMouseDown={onMouseDown}>
        <SpoilerView />
      </div>,
    )

    const button = screen.getByRole("button", { name: /Show spoiler/ })
    fireEvent.mouseDown(button)
    fireEvent.click(button)

    expect(onMouseDown).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it("updates custom spoiler labels without editing the toggle button directly", async () => {
    const user = userEvent.setup()
    const updateAttributes = vi.fn()
    const SpoilerViewWithProps = SpoilerView as ComponentType<{
      node: { attrs: { hideLabel?: string; showLabel?: string } }
      updateAttributes: (attrs: Record<string, string>) => void
    }>

    render(
      <SpoilerViewWithProps
        node={{ attrs: { hideLabel: "Close secret", showLabel: "Big secret" } }}
        updateAttributes={updateAttributes}
      />,
    )

    expect(screen.getByRole("button", { name: /Big secret/ })).toBeVisible()

    await user.clear(screen.getByLabelText("Show spoiler label"))
    await user.type(screen.getByLabelText("Show spoiler label"), "Do not open")
    await user.clear(screen.getByLabelText("Hide spoiler label"))
    await user.type(screen.getByLabelText("Hide spoiler label"), "Close it")

    expect(updateAttributes).toHaveBeenLastCalledWith({
      hideLabel: "Close it",
      showLabel: "Do not open",
    })
  })
})

describe("PostBody", () => {
  it("renders static Tiptap JSON without mounting the editor", () => {
    const content = {
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: "Opening analysis", type: "text" }],
          type: "heading",
        },
        {
          content: [
            { text: "A careful read with ", type: "text" },
            {
              marks: [{ type: "bold" }],
              text: "strong emphasis",
              type: "text",
            },
            { text: " and a ", type: "text" },
            {
              marks: [
                {
                  attrs: { href: "https://example.com/source" },
                  type: "link",
                },
              ],
              text: "source link",
              type: "text",
            },
            { text: ".", type: "text" },
          ],
          type: "paragraph",
        },
        {
          attrs: { language: "ts" },
          content: [{ text: "const shot = 'layout'", type: "text" }],
          type: "codeBlock",
        },
      ],
      type: "doc",
    }

    render(<PostBody content={content} />)

    expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "Opening analysis" }),
    ).toHaveAttribute("id", "opening-analysis")
    expect(screen.getByText("strong emphasis").closest("strong")).not.toBeNull()
    expect(screen.getByRole("link", { name: "source link" })).toHaveAttribute(
      "href",
      "https://example.com/source",
    )
    expect(screen.getByText("const shot = 'layout'")).toBeVisible()
  })

  it("renders galleries, video embeds, and spoiler blocks statically", () => {
    const content = {
      content: [
        {
          attrs: {
            images: JSON.stringify([
              {
                alt: "Second frame",
                caption: "Motion comparison",
                url: "https://cdn.example.com/content-images/scene-b.gif",
              },
            ]),
          },
          type: "imageGallery",
        },
        {
          attrs: {
            caption: "Opening sequence",
            url: "https://youtu.be/dQw4w9WgXcQ",
          },
          type: "videoEmbed",
        },
        {
          attrs: {
            hideLabel: "Close secret",
            showLabel: "Big secret",
          },
          content: [
            {
              content: [{ text: "Spoiler text", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "spoiler",
        },
      ],
      type: "doc",
    }

    render(<PostBody content={content} />)

    expect(screen.getByRole("img", { name: "Second frame" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/content-images/scene-b.gif",
    )
    expect(screen.getByText("Motion comparison")).toBeVisible()
    expect(screen.getByTitle("Opening sequence")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
    expect(screen.getByRole("button", { name: "Big secret" })).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Big secret" }))
    expect(screen.getByRole("button", { name: "Close secret" })).toBeVisible()
    expect(screen.getByText("Spoiler text")).toBeVisible()
  })

  it("renders editor highlight, underline, alignment, and task lists statically", () => {
    const content = {
      content: [
        {
          attrs: { textAlign: "center" },
          content: [
            {
              marks: [{ type: "highlight" }, { type: "underline" }],
              text: "Marked text",
              type: "text",
            },
          ],
          type: "paragraph",
        },
        {
          content: [
            {
              attrs: { checked: true },
              content: [
                {
                  content: [{ text: "Done item", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "taskItem",
            },
          ],
          type: "taskList",
        },
      ],
      type: "doc",
    }

    render(<PostBody content={content} />)

    const marked = screen.getByText("Marked text")
    expect(marked.closest("mark")).toHaveClass("editor-highlight")
    expect(marked.closest("u")).not.toBeNull()
    expect(marked.closest("p")).toHaveStyle({ textAlign: "center" })
    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(screen.getByText("Done item")).toBeVisible()
  })

  it("opens a keyboard-navigable lightbox for post images", async () => {
    const user = userEvent.setup()
    const content = {
      content: [
        {
          attrs: {
            alt: "First frame",
            src: "https://cdn.example.com/content-images/scene-a.webp",
          },
          type: "image",
        },
        {
          attrs: {
            images: JSON.stringify([
              {
                alt: "Second frame",
                caption: "Motion comparison",
                url: "https://cdn.example.com/content-images/scene-b.gif",
              },
            ]),
          },
          type: "imageGallery",
        },
      ],
      type: "doc",
    }

    render(<PostBody content={content} />)

    await user.click(screen.getByRole("img", { name: "First frame" }))

    expect(
      screen.getByRole("dialog", { name: "Image viewer" }),
    ).toBeVisible()
    expect(screen.getByText("1 / 2")).toBeVisible()

    await user.keyboard("{ArrowRight}")

    const lightbox = within(
      screen.getByRole("dialog", { name: "Image viewer" }),
    )
    expect(lightbox.getByRole("img", { name: "Second frame" })).toBeVisible()
    expect(lightbox.getByText("Motion comparison")).toBeVisible()

    await user.keyboard("{Escape}")

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Image viewer" }),
      ).not.toBeInTheDocument()
    })
  })
})
