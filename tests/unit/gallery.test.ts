import { describe, expect, it } from "vitest"

import { reorderGalleryImages, type GalleryImage } from "@/components/editor/gallery"

const images: GalleryImage[] = [
  { alt: "A", caption: "", url: "a.webp" },
  { alt: "B", caption: "", url: "b.webp" },
  { alt: "C", caption: "", url: "c.webp" },
]

describe("reorderGalleryImages", () => {
  it("moves media directly to its dropped position", () => {
    expect(reorderGalleryImages(images, 0, 2).map((image) => image.url)).toEqual([
      "b.webp",
      "c.webp",
      "a.webp",
    ])
  })

  it("returns the original order for invalid or unchanged positions", () => {
    expect(reorderGalleryImages(images, -1, 2)).toBe(images)
    expect(reorderGalleryImages(images, 1, 1)).toBe(images)
  })
})
