import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

interface UseEditorOptions {
  content?: {
    content?: Array<{
      attrs?: Record<string, unknown>
      content?: Array<{
        attrs?: Record<string, unknown>
        marks?: Array<{ attrs?: Record<string, unknown>; type?: string }>
        text?: string
        type?: string
      }>
      marks?: Array<{ attrs?: Record<string, unknown>; type?: string }>
      type?: string
    }>
    type?: string
  }
  editorProps?: {
      attributes?: {
        class?: string
        spellcheck?: string
      }
      transformPastedHTML?: (html: string) => string
  }
  extensions?: Array<{ name?: string }>
  onUpdate?: (input: {
    editor: {
      getJSON: () => NonNullable<UseEditorOptions["content"]>
      getText: () => string
    }
  }) => void
}

const useEditorMock = vi.hoisted(() => {
  const calls: unknown[] = []
  const fn = vi.fn((options: unknown) => {
    calls.push(options)

    return {
      storage: {
        characterCount: {
          characters: () => 0,
          words: () => 0,
        },
      },
    }
  })

  return { calls, fn }
})

vi.mock("@tiptap/react", () => ({
  EditorContent: () => <div data-testid="editor-content" />,
  useEditor: useEditorMock.fn,
}))
vi.mock("@/components/editor/EditorToolbar", () => ({
  EditorToolbar: ({ mode }: { mode?: string }) => (
    <div data-mode={mode} data-testid="editor-toolbar" />
  ),
}))

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { stripPastedTextColors } from "@/components/editor/content"

function getEditorClass() {
  const options = useEditorMock.calls.at(-1) as UseEditorOptions | undefined

  return options?.editorProps?.attributes?.class ?? ""
}

function getEditorSpellcheck() {
  const options = useEditorMock.calls.at(-1) as UseEditorOptions | undefined

  return options?.editorProps?.attributes?.spellcheck
}

describe("TiptapEditor", () => {
  beforeEach(() => {
    useEditorMock.calls.length = 0
    useEditorMock.fn.mockClear()
  })

  it("uses compact write-mode prose classes when editable", () => {
    render(<TiptapEditor editable />)

    expect(getEditorClass()).toContain("prose-editor")
    expect(getEditorClass()).toContain("min-h-[420px]")
    expect(getEditorClass()).not.toContain("prose prose-lg")
  })

  it("disables browser spellcheck by default for write mode", () => {
    render(<TiptapEditor editable />)

    expect(getEditorSpellcheck()).toBe("false")
  })

  it("does not install a custom italic caret widget that can intercept editing", () => {
    render(<TiptapEditor editable />)

    const options = useEditorMock.calls.at(-1) as UseEditorOptions

    expect(options.extensions?.some((extension) => extension.name === "italicCaret")).toBe(false)
  })

  it("keeps read-mode typography classes when not editable", () => {
    render(<TiptapEditor editable={false} />)

    expect(getEditorClass()).toContain("prose prose-lg")
    expect(getEditorClass()).toContain("dark:prose-invert")
    expect(getEditorClass()).not.toContain("prose-editor")
  })

  it("uses a compact editor surface and toolbar for small rich-text fields", () => {
    const { getByTestId } = render(<TiptapEditor editable mode="compact" />)

    expect(getEditorClass()).toContain("min-h-[120px]")
    expect(getEditorClass()).not.toContain("min-h-[420px]")
    expect(getByTestId("editor-toolbar")).toHaveAttribute(
      "data-mode",
      "compact",
    )
  })

  it("normalizes legacy image nodes before initializing Tiptap", () => {
    render(
      <TiptapEditor
        content={{
          content: [
            { attrs: { alt: "Frame", src: "/frame.webp" }, type: "image" },
            {
              content: [
                { attrs: { alt: "Nested", src: "/nested.webp" }, type: "image" },
              ],
              type: "blockquote",
            },
          ],
          type: "doc",
        }}
      />,
    )

    const options = useEditorMock.calls.at(-1) as UseEditorOptions

    expect(options.content?.content?.[0]?.type).toBe("customImage")
    expect(options.content?.content?.[1]?.content?.[0]?.type).toBe("customImage")
  })

  it("falls back to the default editor color for disallowed saved text colors", () => {
    render(
      <TiptapEditor
        content={{
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
                {
                  marks: [
                    {
                      attrs: { color: "#dc2626" },
                      type: "textStyle",
                    },
                  ],
                  text: "Toolbar red text",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "doc",
        }}
      />,
    )

    const options = useEditorMock.calls.at(-1) as UseEditorOptions
    const firstMark = options.content?.content?.[0]?.content?.[0]?.marks?.[0]
    const secondMark = options.content?.content?.[0]?.content?.[1]?.marks?.[0]

    expect(firstMark).toBeUndefined()
    expect(secondMark).toMatchObject({
      attrs: { color: "#dc2626" },
      type: "textStyle",
    })
  })

  it("cleans disallowed text colors before emitting editor changes", () => {
    const onChange = vi.fn()

    render(<TiptapEditor editable onChange={onChange} />)

    const options = useEditorMock.calls.at(-1) as UseEditorOptions
    options.onUpdate?.({
      editor: {
        getJSON: () => ({
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
                  text: "Browser color text",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "doc",
        }),
        getText: () => "Browser color text",
      },
    })

    expect(onChange).toHaveBeenCalledWith(
      {
        content: [
          {
            content: [
              {
                text: "Browser color text",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      "Browser color text",
    )
  })

  it("strips text color from pasted HTML before Tiptap parses it", () => {
    const html =
      '<p><span style="color: rgb(255, 255, 255); background-color: rgb(254, 240, 138);">Copied text</span></p>'

    expect(stripPastedTextColors(html)).toBe(
      '<p><span style="background-color: rgb(254, 240, 138);">Copied text</span></p>',
    )
  })
})
