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
    const columnsPosition = gallerySource.indexOf('>Columns:</span>')
    expect(switchPosition).toBeLessThan(addPosition)
    expect(addPosition).toBeLessThan(columnsPosition)
  })
})
