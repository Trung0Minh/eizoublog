import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { NodeViewProps } from "@tiptap/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@tiptap/react", () => ({
  NodeViewContent: () => <span>Editor caption</span>,
  NodeViewWrapper: ({ children }: { children: ReactNode }) => (
    <figure>{children}</figure>
  ),
}))

vi.mock("@/components/editor/GalleryAddMediaButton", () => ({
  GalleryAddMediaButton: () => (
    <button title="Add media" type="button">
      Add media
    </button>
  ),
}))

import { ImageNodeView } from "@/components/editor/extensions/ImageNodeView"

function createImageNodeViewProps(): NodeViewProps {
  return {
    deleteNode: vi.fn(),
    editor: {
      commands: { focus: vi.fn() },
      isEditable: true,
      schema: { nodes: {} },
      state: { tr: { replaceWith: vi.fn() } },
      view: { dispatch: vi.fn() },
    },
    getPos: () => 0,
    node: {
      attrs: {
        alt: "Rotated editor frame",
        align: "center",
        flipX: false,
        flipY: true,
        naturalHeight: 800,
        naturalWidth: 1200,
        rotation: 90,
        showCaption: true,
        src: "https://cdn.example.com/editor-frame.webp",
        width: "100%",
      },
      nodeSize: 1,
      textContent: "Editor caption",
    },
    selected: true,
    updateAttributes: vi.fn(),
  } as unknown as NodeViewProps
}

describe("ImageNodeView", () => {
  it("opens transformed editor images in the zoom viewer", async () => {
    const user = userEvent.setup()

    render(<ImageNodeView {...createImageNodeViewProps()} />)

    await user.click(screen.getByTitle("Zoom image"))

    const lightbox = screen.getByRole("dialog", { name: "Image viewer" })
    expect(lightbox).toBeVisible()
    expect(
      within(lightbox).getByRole("img", { name: "Rotated editor frame" }),
    ).toHaveStyle({
      transform: "rotate(90deg) scale(1.5, -1.5)",
      transformOrigin: "center",
    })
    expect(within(lightbox).getByText("Editor caption")).toBeVisible()
  })
})
