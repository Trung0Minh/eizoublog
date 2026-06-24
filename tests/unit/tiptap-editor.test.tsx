import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

interface UseEditorOptions {
  content?: {
    content?: Array<{
      attrs?: Record<string, unknown>
      content?: Array<{ attrs?: Record<string, unknown>; type?: string }>
      type?: string
    }>
    type?: string
  }
  editorProps?: {
      attributes?: {
        class?: string
        spellcheck?: string
      }
  }
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
  EditorToolbar: () => <div data-testid="editor-toolbar" />,
}))

import { TiptapEditor } from "@/components/editor/TiptapEditor"

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

  it("keeps read-mode typography classes when not editable", () => {
    render(<TiptapEditor editable={false} />)

    expect(getEditorClass()).toContain("prose prose-lg")
    expect(getEditorClass()).toContain("dark:prose-invert")
    expect(getEditorClass()).not.toContain("prose-editor")
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
})
