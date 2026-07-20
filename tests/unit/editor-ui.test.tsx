import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

interface MockPostImage {
  alt: string
  caption?: string
  src: string
}

interface PresignedUploadFile {
  name: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getPresignedUploadFiles(init?: RequestInit): PresignedUploadFile[] {
  if (typeof init?.body !== "string") {
    return []
  }

  const parsed: unknown = JSON.parse(init.body)

  if (!isRecord(parsed) || !Array.isArray(parsed.files)) {
    return []
  }

  return parsed.files.flatMap((file) =>
    isRecord(file) && typeof file.name === "string"
      ? [{ name: file.name }]
      : [],
  )
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
vi.mock("emoji-picker-react", () => ({
  default: ({
    onEmojiClick,
    searchPlaceHolder,
  }: {
    onEmojiClick: (emoji: { emoji: string }) => void
    searchPlaceHolder: string
  }) => (
    <div data-search-placeholder={searchPlaceHolder} data-testid="full-emoji-picker">
      <button
        aria-label="Pick melting face"
        onClick={() => onEmojiClick({ emoji: "🫠" })}
        type="button"
      >
        Pick emoji
      </button>
    </div>
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
import { LinkEditModal } from "@/components/editor/LinkEditModal"
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
  initiallyDirty = false,
  onSave,
}: {
  initiallyDirty?: boolean
  onSave: () => Promise<void>
}) {
  const { isDirty, markDirty, save } = useAutosave({ onSave, postId: "post-1" })

  useEffect(() => {
    if (initiallyDirty) markDirty()
  }, [initiallyDirty, markDirty])

  return <>
    <span data-testid="dirty-state">{isDirty ? "dirty" : "clean"}</span>
    <button onClick={markDirty} type="button">change</button>
    <button onClick={() => void save()} type="button">save</button>
  </>
}

describe("useAutosave", () => {
  it("does not save when the current draft is clean", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(<AutosaveHarness onSave={onSave} />)
    await user.click(screen.getByRole("button", { name: "save" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("keeps newer edits dirty and saves them after an in-flight save", async () => {
    const user = userEvent.setup()
    let finishFirstSave: (() => void) | undefined
    const firstSave = new Promise<void>((resolve) => {
      finishFirstSave = resolve
    })
    const onSave = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(firstSave)
      .mockResolvedValueOnce(undefined)

    render(<AutosaveHarness initiallyDirty onSave={onSave} />)
    await waitFor(() => expect(screen.getByTestId("dirty-state")).toHaveTextContent("dirty"))

    await user.click(screen.getByRole("button", { name: "save" }))
    await user.click(screen.getByRole("button", { name: "change" }))
    finishFirstSave?.()

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByTestId("dirty-state")).toHaveTextContent("clean"))
  })
})

describe("MediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string | URL, init?: RequestInit) => {
        if (url === "/api/upload/presigned") {
          const files = getPresignedUploadFiles(init)
          return Promise.resolve(new Response(
            JSON.stringify({
              data: {
                files: files.map((file) => ({
                  uploadUrl: `https://example.com/upload/${file.name}`,
                  publicUrl: `https://cdn.example.com/content-images/${file.name}`,
                })),
              },
            }),
            { status: 200 }
          ))
        }
        if (url === "/api/categories") {
          return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }))
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
      })
    )

    // Stub XMLHttpRequest to simulate successful file upload to S3/R2
    class MockXMLHttpRequest {
      status = 200
      onload: (() => void) | null = null
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn(function (this: MockXMLHttpRequest) {
        setTimeout(() => {
          this.status = 200
          this.onload?.()
        }, 10)
      })
      upload = {
        onprogress: null,
      }
    }
    vi.stubGlobal("XMLHttpRequest", MockXMLHttpRequest)

    vi.spyOn(window, "alert").mockImplementation((msg) => {
      console.error("ALERT ERROR:", msg)
      return undefined
    })
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
        "https://cdn.example.com/content-images/scene.gif",
        "",
      )
    })
    expect(fetch).toHaveBeenCalledWith("/api/upload/presigned", {
      body: expect.stringContaining("scene.gif"),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
  })

  it("inserts multiple selected images directly as a gallery", async () => {
    const user = userEvent.setup()
    const onInsertGallery = vi.fn()
    render(
      <MediaUpload
        onInsertGallery={onInsertGallery}
        onInsertSingle={vi.fn()}
      />,
    )

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).toHaveAttribute("multiple")

    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])

    await waitFor(() => {
      expect(onInsertGallery).toHaveBeenCalledWith([
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
      ])
    })
  })
})

describe("EditorToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string | URL, init?: RequestInit) => {
        if (url === "/api/upload/presigned") {
          const files = getPresignedUploadFiles(init)
          return Promise.resolve(new Response(
            JSON.stringify({
              data: {
                files: files.map((file) => ({
                  uploadUrl: `https://example.com/upload/${file.name}`,
                  publicUrl: `https://cdn.example.com/content-images/${file.name}`,
                })),
              },
            }),
            { status: 200 }
          ))
        }
        if (url === "/api/categories") {
          return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }))
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
      })
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
        alt: "",
        src: "https://cdn.example.com/content-images/scene.gif",
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
    render(<EditorToolbar editor={editor as never} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(input!, [
      new File(["webp"], "scene-a.webp", { type: "image/webp" }),
      new File(["gif"], "scene-b.gif", { type: "image/gif" }),
    ])

    await waitFor(() => {
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
  })

  it("keeps gallery layout controls out of the global editor toolbar", () => {
    const editor = {
      chain: vi.fn(),
      getAttributes: vi.fn(() => ({ layout: "grid" })),
      isActive: vi.fn((name: string) => name === "imageGallery"),
    }

    render(<EditorToolbar editor={editor as never} />)

    expect(
      screen.queryByRole("button", { name: /switch gallery/i }),
    ).not.toBeInTheDocument()
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

  it("centers toolbar group dividers vertically", () => {
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    const { container } = render(<EditorToolbar editor={editor as never} />)

    expect(container.querySelector(".self-center")).toBeInTheDocument()
  })

  it("keeps the editor controls in one compact row within the editor width", () => {
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    const { container } = render(<EditorToolbar editor={editor as never} />)

    expect(container.querySelector(".max-w-full")).toBeInTheDocument()
    expect(container.querySelector(".flex-nowrap")).toBeInTheDocument()
    expect(container.querySelector(".justify-between")).toBeInTheDocument()
    expect(container.querySelector(".w-\\[32px\\]")).toBeInTheDocument()
  })

  it("supports highlight colors, text alignment, and task list toolbar actions", () => {
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
      setColor: vi.fn(() => chain),
      setHighlight: vi.fn(() => chain),
      setTextAlign: vi.fn(() => chain),
      unsetHighlight: vi.fn(() => chain),
      unsetColor: vi.fn(() => chain),
      toggleTaskList: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: "Highlight color" }))
    expect(screen.getByRole("menu", { name: "Highlight colors" }).parentElement).toBe(
      document.body,
    )
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "Highlight amber" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Highlight color" }))
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "Highlight rose" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Highlight color" }))
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "Clear highlight" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Text color" }))
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "Text color red" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Text color" }))
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "Clear text color" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align left" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align center" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Align right" }))
    fireEvent.mouseDown(screen.getByRole("button", { name: "Task list" }))

    expect(chain.setHighlight).toHaveBeenCalledWith({ color: "#fef08a" })
    expect(chain.setHighlight).toHaveBeenCalledWith({ color: "#fecdd3" })
    expect(chain.unsetHighlight).toHaveBeenCalled()
    expect(chain.setColor).toHaveBeenCalledWith("#dc2626")
    expect(chain.unsetColor).toHaveBeenCalled()
    expect(chain.setTextAlign).toHaveBeenCalledWith("left")
    expect(chain.setTextAlign).toHaveBeenCalledWith("center")
    expect(chain.setTextAlign).toHaveBeenCalledWith("right")
    expect(chain.toggleTaskList).toHaveBeenCalled()
  })

  it("opens an app link dialog and applies pasted URLs without browser prompt defaults", async () => {
    const user = userEvent.setup()
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
      setLink: vi.fn(() => chain),
      unsetLink: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({ href: "" })),
      isActive: vi.fn(() => false),
    }
    const promptSpy = vi.spyOn(window, "prompt")

    render(<EditorToolbar editor={editor as never} />)

    fireEvent.click(screen.getByRole("button", { name: "Insert / edit link" }))

    expect(screen.getByRole("dialog")).toBeVisible()
    const input = screen.getByRole("textbox", { name: "URL" })
    expect(input).toHaveValue("")
    expect(promptSpy).not.toHaveBeenCalled()

    await user.type(input, "https://example.com/source")
    await user.click(screen.getByRole("button", { name: "Áp dụng" }))

    expect(chain.setLink).toHaveBeenCalledWith({
      href: "https://example.com/source",
    })
    expect(chain.run).toHaveBeenCalled()
  })

  it("toggles editor spellcheck from the toolbar", () => {
    const onToggleSpellcheck = vi.fn()
    const editor = {
      chain: vi.fn(),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(
      <EditorToolbar
        editor={editor as never}
        onToggleSpellcheck={onToggleSpellcheck}
        spellcheckEnabled={false}
      />,
    )

    fireEvent.mouseDown(screen.getByRole("button", { name: "Enable spellcheck" }))

    expect(onToggleSpellcheck).toHaveBeenCalled()
  })

  it("opens a searchable full emoji picker and inserts at the cursor", async () => {
    const user = userEvent.setup()
    const chain = {
      focus: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run: vi.fn(() => true),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)

    await user.click(screen.getByRole("button", { name: "Chèn emoji" }))
    const picker = await screen.findByTestId("full-emoji-picker")
    expect(picker).toHaveAttribute("data-search-placeholder", "Tìm emoji...")
    await user.click(screen.getByRole("button", { name: "Pick melting face" }))

    expect(chain.insertContent).toHaveBeenCalledWith("🫠")
    expect(chain.run).toHaveBeenCalled()
  })
})

describe("VideoEmbedModal", () => {
  it("submits a trimmed URL without asking for a caption", async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    render(<VideoEmbedModal onClose={vi.fn()} onInsert={onInsert} />)

    await user.type(
      screen.getByRole("textbox", { name: /Đường dẫn video/ }),
      " https://youtu.be/dQw4w9WgXcQ ",
    )

    expect(screen.queryByRole("textbox", { name: /Caption/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Chèn" }))

    expect(onInsert).toHaveBeenCalledWith(
      "https://youtu.be/dQw4w9WgXcQ",
      "",
    )
  })
})

describe("LinkEditModal", () => {
  it("submits a trimmed URL and does not prefill https for new links", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <LinkEditModal
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const input = screen.getByRole("textbox", { name: "URL" })
    expect(input).toHaveValue("")

    await user.type(input, " https://example.com/source ")
    await user.click(screen.getByRole("button", { name: "Áp dụng" }))

    expect(onSubmit).toHaveBeenCalledWith("https://example.com/source")
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
    expect(screen.queryByText("Hide spoiler")).not.toBeInTheDocument()
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

  it("does not render spoiler label editing fields", () => {
    render(<SpoilerView />)

    expect(screen.queryByLabelText("Show spoiler label")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Hide spoiler label")).not.toBeInTheDocument()
  })
})

describe("PostBody", () => {
  it("strips only empty paragraphs from the top and bottom of rendered posts", () => {
    const { container } = render(
      <PostBody
        content={{
          content: [
            { type: "paragraph" },
            {
              content: [{ text: "   ", type: "text" }],
              type: "paragraph",
            },
            {
              content: [{ text: "First paragraph", type: "text" }],
              type: "paragraph",
            },
            { type: "paragraph" },
            {
              content: [{ text: "Middle paragraph", type: "text" }],
              type: "paragraph",
            },
            { type: "paragraph" },
          ],
          type: "doc",
        }}
      />,
    )

    const paragraphs = Array.from(container.querySelectorAll("p"))
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toHaveTextContent("First paragraph")
    expect(paragraphs[1]).toHaveTextContent("")
    expect(paragraphs[2]).toHaveTextContent("Middle paragraph")
  })

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
    expect(screen.getByRole("button", { name: "Show spoiler" })).toBeVisible()
    expect(screen.queryByText("Show spoiler")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Show spoiler" }))
    expect(screen.getByRole("button", { name: "Hide spoiler" })).toBeVisible()
    expect(screen.queryByText("Hide spoiler")).not.toBeInTheDocument()
    expect(screen.getByText("Spoiler text")).toBeVisible()
  })

  it("renders editor highlight, underline, alignment, and task lists statically", () => {
    const content = {
      content: [
        {
          attrs: { textAlign: "center" },
          content: [
            {
              marks: [
                { type: "highlight" },
                { attrs: { color: "#dc2626" }, type: "textStyle" },
                { type: "underline" },
              ],
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
    expect(marked.closest("mark")).toHaveStyle({ backgroundColor: "#fef08a" })
    expect(marked.closest("mark")).toHaveStyle({ color: "#000000" })
    expect(marked.closest(".post-text-color")).toBeNull()
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
