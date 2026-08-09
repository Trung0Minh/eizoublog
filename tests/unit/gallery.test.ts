import { describe, expect, it } from "vitest"

import {
  distributeGalleryImages,
  getGalleryImagePresentation,
  groupGalleryImagesIntoRows,
  galleryRowHasCaption,
  parseGalleryImages,
  reorderGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"

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

describe("distributeGalleryImages", () => {
  it("keeps source order while packing alternating items into independent columns", () => {
    const columns = distributeGalleryImages([...images, { alt: "D", caption: "", url: "d.webp" }], 2)

    expect(columns.map((column) => column.map(({ image }) => image.url))).toEqual([
      ["a.webp", "c.webp"],
      ["b.webp", "d.webp"],
    ])
  })
})

describe("groupGalleryImagesIntoRows", () => {
  it("keeps source-row siblings together so captions share only their row height", () => {
    const rows = groupGalleryImagesIntoRows([...images, { alt: "D", caption: "", url: "d.webp" }], 2)

    expect(rows.map((row) => row.map(({ image }) => image.url))).toEqual([
      ["a.webp", "b.webp"],
      ["c.webp", "d.webp"],
    ])
  })
})

describe("galleryRowHasCaption", () => {
  it("only reserves caption space for siblings in the captioned row", () => {
    const rowImages: GalleryImage[] = [
      { alt: "A", caption: "Row one", showCaption: true, url: "a.webp" },
      { alt: "B", caption: "", url: "b.webp" },
      { alt: "C", caption: "", url: "c.webp" },
      { alt: "D", caption: "", url: "d.webp" },
    ]

    expect(galleryRowHasCaption(rowImages, 1, 2)).toBe(true)
    expect(galleryRowHasCaption(rowImages, 3, 2)).toBe(false)
    expect(galleryRowHasCaption(rowImages, 0, 4)).toBe(true)
  })
})

describe("gallery image transforms", () => {
  it("uses the rotated aspect ratio without clipping quarter-turned media", () => {
    expect(getGalleryImagePresentation({
      alt: "Rotated frame",
      caption: "",
      naturalHeight: 800,
      naturalWidth: 1200,
      rotation: 90,
      url: "frame.webp",
    })).toEqual({
      transform: "rotate(90deg) scale(1.5, 1.5)",
      wrapperAspectRatio: "800 / 1200",
    })
  })

  it("keeps full rotations so the next transform continues in the clicked direction", () => {
    expect(getGalleryImagePresentation({
      alt: "Rotated frame",
      caption: "",
      rotation: 360,
      url: "frame.webp",
    }).transform).toBe("rotate(360deg) scale(1, 1)")
  })

  it("preserves transforms and intrinsic dimensions while parsing and serializing", () => {
    const parsedImages = parseGalleryImages(JSON.stringify([
      {
        alt: "Rotated frame",
        caption: "Frame caption",
        flipX: true,
        flipY: false,
        naturalHeight: 800,
        naturalWidth: 1200,
        rotation: 90,
        showCaption: true,
        url: "https://cdn.example.com/frame.webp",
      },
    ]))

    expect(parsedImages).toEqual([
      expect.objectContaining({
        flipX: true,
        flipY: false,
        naturalHeight: 800,
        naturalWidth: 1200,
        rotation: 90,
      }),
    ])
    expect(serializeGalleryImages(parsedImages)).toContain('"rotation":90')
  })
})
