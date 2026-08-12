import { fireEvent, render, screen } from "@testing-library/react"
import type { Editor, JSONContent } from "@tiptap/react"
import { describe, expect, it, vi } from "vitest"

import { EditorTableOfContents } from "@/components/editor/EditorTableOfContents"

const content: JSONContent = {
  content: [
    {
      attrs: { level: 2 },
      content: [{ text: "Khởi đầu", type: "text" }],
      type: "heading",
    },
    {
      attrs: { level: 3 },
      content: [{ text: "Nhịp chuyển động", type: "text" }],
      type: "heading",
    },
  ],
  type: "doc",
}

function createEditor(selectionFrom = 1) {
  const run = vi.fn()
  const scrollIntoView = vi.fn(() => ({ run }))
  const setTextSelection = vi.fn(() => ({ scrollIntoView }))
  const focus = vi.fn(() => ({ setTextSelection }))
  const listeners = new Map<string, () => void>()
  const editor = {
    chain: () => ({ focus }),
    getJSON: () => content,
    off: vi.fn((event: string) => listeners.delete(event)),
    on: vi.fn((event: string, listener: () => void) => {
      listeners.set(event, listener)
    }),
    state: {
      doc: {
        descendants: (
          callback: (
            node: { textContent: string; type: { name: string } },
            position: number,
          ) => void,
        ) => {
          callback({ textContent: "Khởi đầu", type: { name: "heading" } }, 0)
          callback(
            { textContent: "Nhịp chuyển động", type: { name: "heading" } },
            12,
          )
        },
      },
      selection: { from: selectionFrom },
    },
  }

  return {
    editor: editor as unknown as Editor,
    focus,
    listeners,
    run,
    scrollIntoView,
    setTextSelection,
  }
}

describe("EditorTableOfContents", () => {
  it("renders the live heading hierarchy and marks the section at the cursor", () => {
    const { editor } = createEditor(14)

    render(<EditorTableOfContents content={content} editor={editor} />)

    expect(screen.getByRole("navigation", { name: "Điều hướng bài viết" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Khởi đầu" })).toHaveAttribute(
      "aria-current",
      "false",
    )
    expect(
      screen.getByRole("button", { name: "Nhịp chuyển động" }),
    ).toHaveAttribute("aria-current", "location")
    expect(
      screen
        .getByRole("button", { name: "Nhịp chuyển động" })
        .querySelector('[data-heading-marker="dot"]'),
    ).not.toBeNull()
    expect(screen.getByText("Dàn ý bài viết")).toHaveClass("text-[12px]")
  })

  it("moves the editor selection to a heading when it is selected", () => {
    const { editor, focus, run, scrollIntoView, setTextSelection } = createEditor()

    render(<EditorTableOfContents content={content} editor={editor} />)
    fireEvent.click(screen.getByRole("button", { name: "Nhịp chuyển động" }))

    expect(focus).toHaveBeenCalled()
    expect(setTextSelection).toHaveBeenCalledWith(13)
    expect(scrollIntoView).toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
  })

  it("uses a compact disclosure without showing an empty outline", () => {
    const { editor } = createEditor()
    const { rerender } = render(
      <EditorTableOfContents collapsible content={content} editor={editor} />,
    )

    const toggle = screen.getByRole("button", { name: "Mục lục bài viết" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")

    rerender(
      <EditorTableOfContents
        collapsible
        content={{ content: [{ type: "paragraph" }], type: "doc" }}
        editor={null}
      />,
    )
    expect(
      screen.queryByRole("button", { name: "Mục lục bài viết" }),
    ).not.toBeInTheDocument()
  })
})
