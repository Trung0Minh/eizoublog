import { fireEvent, render, screen } from "@testing-library/react"
import { getSchema } from "@tiptap/core"
import { EditorState } from "@tiptap/pm/state"
import type { Transaction } from "@tiptap/pm/state"
import type { NodeViewProps } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@tiptap/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tiptap/react")>(),
  NodeViewWrapper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import { ImageGalleryBlock } from "@/components/editor/ImageGalleryBlock"
import { CustomImageExtension } from "@/components/editor/extensions/CustomImageExtension"
import { GalleryExtension } from "@/components/editor/extensions/GalleryExtension"
import { VideoEmbedExtension } from "@/components/editor/extensions/VideoEmbedExtension"
import { serializeGalleryImages } from "@/components/editor/gallery"

function setup(layout: string, editable = true) {
  const schema = getSchema([StarterKit, CustomImageExtension, GalleryExtension, VideoEmbedExtension])
  const images = [
    { url: "/first.webp", alt: "First", caption: "Caption", showCaption: true, rotation: 90, flipX: true, naturalWidth: 1200, naturalHeight: 800 },
    { url: "/second.webp", alt: "Second", caption: "Hidden caption", showCaption: false },
    { url: "/clip.mp4", alt: "Clip", caption: "Video caption", showCaption: true },
  ]
  const node = schema.nodes.imageGallery.create({ images: serializeGalleryImages(images), layout, caption: "Group caption", showCaption: true })
  const before = schema.nodes.paragraph.create(null, schema.text("Before"))
  const after = schema.nodes.paragraph.create(null, schema.text("After"))
  let state = EditorState.create({ schema, doc: schema.nodes.doc.create(null, [before, node, after]) })
  const dispatch = (tr: Transaction) => { state = state.apply(tr) }
  const props = {
    node,
    editor: { schema, get state() { return state }, view: { dispatch }, commands: { focus: vi.fn() }, isEditable: editable },
    getPos: () => before.nodeSize,
    deleteNode: () => dispatch(state.tr.delete(before.nodeSize, before.nodeSize + node.nodeSize)),
    updateAttributes: vi.fn(),
    selected: true,
  } as unknown as NodeViewProps
  render(<ImageGalleryBlock {...props} />)
  return () => state.doc.toJSON()
}

describe("gallery group actions", () => {
  it.each(["grid", "horizontal"])("ungroups a %s gallery in place without losing media details", (layout) => {
    const doc = setup(layout)
    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }))
    expect(doc().content).toMatchObject([
      { type: "paragraph", content: [{ text: "Before" }] },
      { type: "customImage", attrs: { src: "/first.webp", alt: "First", width: "100%", align: "center", rotation: 90, flipX: true, naturalWidth: 1200, naturalHeight: 800, showCaption: true }, content: [{ text: "Caption" }] },
      { type: "customImage", attrs: { src: "/second.webp", showCaption: false }, content: [{ text: "Hidden caption" }] },
      { type: "videoEmbed", attrs: { url: "/clip.mp4", caption: "Video caption", showCaption: true } },
      { type: "paragraph", content: [{ text: "Group caption" }] },
      { type: "paragraph", content: [{ text: "After" }] },
    ])
    expect(doc().content).toHaveLength(6)
  })

  it.each(["grid", "horizontal"])("removes the whole %s group while preserving surrounding text", (layout) => {
    const doc = setup(layout)
    fireEvent.click(screen.getByRole("button", { name: "Remove group" }))
    expect(doc().content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "Before" }] },
      { type: "paragraph", content: [{ type: "text", text: "After" }] },
    ])
  })

  it("does not expose group actions in read-only content", () => {
    setup("grid", false)
    expect(screen.queryByRole("button", { name: "Ungroup" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove group" })).not.toBeInTheDocument()
  })
})
