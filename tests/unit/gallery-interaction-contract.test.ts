import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("gallery reorder interaction", () => {
  it("keeps pointer dragging for grids and pick-and-place for horizontal lists", () => {
    const source = readFileSync(
      join(process.cwd(), "components/editor/ImageGalleryBlock.tsx"),
      "utf8",
    )

    expect(source).toContain('layout === "grid"')
    expect(source).toContain("startPointerReorder")
    expect(source).toContain("pickHorizontalImage")
    expect(source).toContain("Place media at position")
    expect(source).toContain("Press Escape to cancel")
  })

  it("keeps the layout switch in the local gallery controls without a redundant layout label", () => {
    const gallerySource = readFileSync(
      join(process.cwd(), "components/editor/ImageGalleryBlock.tsx"),
      "utf8",
    )
    const toolbarSource = readFileSync(
      join(process.cwd(), "components/editor/EditorToolbar.tsx"),
      "utf8",
    )

    expect(gallerySource).toContain('aria-label="Switch gallery to horizontal list"')
    expect(gallerySource).toContain('aria-label="Switch gallery to grid"')
    expect(gallerySource).not.toContain('"Horizontal gallery"')
    expect(toolbarSource).not.toContain('updateAttributes("imageGallery"')

    const switchPosition = gallerySource.indexOf('aria-label="Switch gallery to horizontal list"')
    const addPosition = gallerySource.indexOf("<GalleryAddMediaButton")
    expect(switchPosition).toBeLessThan(addPosition)
    expect(gallerySource).not.toContain('>Columns:</span>')
  })

  it("places the gallery controls in a vertical rail beside the media", () => {
    const source = readFileSync(
      join(process.cwd(), "components/editor/ImageGalleryBlock.tsx"),
      "utf8",
    )

    expect(source).toContain("relative group")
    expect(source).toContain("-left-9 top-0")
    expect(source).not.toContain("-translate-y-1/2")
    expect(source).toContain("flex-col")
    expect(source).toContain("bg-accent text-button-text")
  })

  it("offers image controls and a separate gallery caption control in both layouts", () => {
    const source = readFileSync(
      join(process.cwd(), "components/editor/ImageGalleryBlock.tsx"),
      "utf8",
    )

    expect(source).toContain('title="Rotate left"')
    expect(source).toContain('title="Rotate right"')
    expect(source).toContain('title="Flip horizontal"')
    expect(source).toContain('title="Flip vertical"')
    expect(source).toContain('title="Zoom image"')
    expect(source).toContain('title="Toggle gallery caption"')
    expect(source).toContain('placeholder="Write a gallery caption..."')
    expect(source).toContain('onMouseDown={(event) => event.preventDefault()}')
    expect(source).toContain("<textarea")
  })

  it("uses the shared rotated-media presentation", () => {
    const source = readFileSync(
      join(process.cwd(), "components/editor/ImageGalleryBlock.tsx"),
      "utf8",
    )

    expect(source).toContain('alignItems: "center"')
    expect(source).toContain("getGalleryImagePresentation(image)")
    expect(source).toContain("aspectRatio: wrapperAspectRatio")
    expect(source).toContain('overflow: "hidden"')
  })

  it("uses compact rows and caption lanes", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

    expect(css).toContain("column-gap: 0.25rem;")
    expect(css).toContain(".image-gallery__grid-row")
    expect(css).toContain("margin-top: 0.375rem;")
    expect(css).toContain(".prose-editor .image-gallery__image")
    expect(css).toContain("width: calc(100% - 1rem);")
    expect(css).toContain("overflow: hidden;")
    expect(css).toContain(".image-gallery__gallery-caption {\n    font-style: italic;\n    margin-inline: auto;\n    margin-top: 0.5rem;")
    expect(css).toContain("transition: transform 200ms ease;")
  })

  it("allows list galleries to stop at an arbitrary scroll position", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

    expect(css).not.toContain("scroll-snap-type:")
    expect(css).not.toContain("scroll-snap-align:")
  })
})
