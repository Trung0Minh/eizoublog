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
  const focus = vi.fn(() => true)
  const listeners = new Map<string, () => void>()
  const headingElements = [document.createElement("h2"), document.createElement("h3")]
  const editor = {
    commands: { focus },
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
    view: {
      nodeDOM: vi.fn((position: number) =>
        position === 0 ? headingElements[0] : headingElements[1],
      ),
    },
  }

  return {
    editor: editor as unknown as Editor,
    focus,
    headingElements,
    listeners,
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
    expect(screen.getByText("Mục lục")).toHaveClass("text-[12px]")
  })

  it("moves the caret to a heading and aligns it below the sticky toolbar", () => {
    const { editor, focus, headingElements } = createEditor()
    const scrollContainer = document.createElement("div")
    const toolbar = document.createElement("div")
    const scrollTo = vi.fn()
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0)
        return 1
      })

    Object.defineProperty(scrollContainer, "scrollTop", {
      configurable: true,
      value: 300,
      writable: true,
    })
    Object.defineProperty(scrollContainer, "scrollTo", {
      configurable: true,
      value: scrollTo,
    })
    scrollContainer.getBoundingClientRect = vi.fn(() => ({
      bottom: 900,
      height: 800,
      left: 0,
      right: 1000,
      top: 100,
      width: 1000,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))
    toolbar.getBoundingClientRect = vi.fn(() => ({
      bottom: 148,
      height: 48,
      left: 0,
      right: 1000,
      top: 100,
      width: 1000,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))
    headingElements[1].getBoundingClientRect = vi.fn(() => ({
      bottom: 640,
      height: 40,
      left: 0,
      right: 800,
      top: 600,
      width: 800,
      x: 0,
      y: 600,
      toJSON: () => ({}),
    }))

    render(
      <EditorTableOfContents
        content={content}
        editor={editor}
        scrollContainerRef={{ current: scrollContainer }}
        stickyToolbarRef={{ current: toolbar }}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Nhịp chuyển động" }))

    expect(focus).toHaveBeenCalledWith(13, { scrollIntoView: false })
    expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 736 })
    requestAnimationFrameSpy.mockRestore()
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
    expect(
      screen.getByRole("button", { name: "Khởi đầu" }).closest(".overflow-y-auto"),
    ).toBeNull()

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
