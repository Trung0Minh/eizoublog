export interface GalleryImage {
  alt: string
  caption: string
  flipX?: boolean
  flipY?: boolean
  naturalHeight?: number | null
  naturalWidth?: number | null
  rotation?: number
  url: string
  showCaption?: boolean
}

export type GalleryLayout = "grid" | "horizontal"

export function normalizeGalleryLayout(value: unknown): GalleryLayout {
  return value === "horizontal" ? "horizontal" : "grid"
}

export function getGalleryImagePresentation(image: GalleryImage) {
  const { transform, wrapperAspectRatio } = getMediaPresentation(image)

  return {
    transform,
    wrapperAspectRatio,
  }
}

export function distributeGalleryImages(
  images: readonly GalleryImage[],
  requestedColumnCount: number,
) {
  const columnCount = Math.max(1, Math.min(
    images.length || 1,
    Number.isFinite(requestedColumnCount) ? Math.floor(requestedColumnCount) : 1,
  ))
  const columns = Array.from({ length: columnCount }, () => [] as Array<{
    image: GalleryImage
    index: number
  }>)

  images.forEach((image, index) => {
    columns[index % columnCount].push({ image, index })
  })

  return columns
}

export function groupGalleryImagesIntoRows(
  images: readonly GalleryImage[],
  requestedColumnCount: number,
) {
  const columnCount = Math.max(1, Math.min(
    images.length || 1,
    Number.isFinite(requestedColumnCount) ? Math.floor(requestedColumnCount) : 1,
  ))

  return Array.from(
    { length: Math.ceil(images.length / columnCount) },
    (_, rowIndex) => images
      .slice(rowIndex * columnCount, (rowIndex + 1) * columnCount)
      .map((image, offset) => ({ image, index: rowIndex * columnCount + offset })),
  )
}

export function galleryRowHasCaption(
  images: readonly GalleryImage[],
  index: number,
  columnCount: number,
) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount))
  const rowStart = Math.floor(index / safeColumnCount) * safeColumnCount

  return images.slice(rowStart, rowStart + safeColumnCount).some(
    (image) => image.showCaption !== false && image.caption.trim() !== "",
  )
}

export function reorderGalleryImages(
  images: readonly GalleryImage[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= images.length ||
    toIndex >= images.length ||
    fromIndex === toIndex
  ) {
    return images
  }

  const reordered = [...images]
  const [movedImage] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, movedImage)
  return reordered
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function getGalleryImageAlt(image: GalleryImage) {
  return image.alt.trim() || image.caption.trim()
}

export function parseGalleryImages(value: unknown): GalleryImage[] {
  let parsed = value

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.flatMap((item) => {
    if (!isRecord(item) || typeof item.url !== "string") {
      return []
    }

    return [
      {
        alt: typeof item.alt === "string" ? item.alt : "",
        caption: typeof item.caption === "string" ? item.caption : "",
        flipX: item.flipX === true,
        flipY: item.flipY === true,
        naturalHeight: positiveNumber(item.naturalHeight),
        naturalWidth: positiveNumber(item.naturalWidth),
        rotation: finiteNumber(item.rotation) ?? 0,
        url: item.url,
        showCaption: typeof item.showCaption === "boolean" ? item.showCaption : !!(typeof item.caption === "string" && item.caption),
      },
    ]
  })
}

export function serializeGalleryImages(images: readonly GalleryImage[]) {
  return JSON.stringify(
    images.map((image) => ({
      alt: image.alt,
      caption: image.caption,
      flipX: image.flipX === true,
      flipY: image.flipY === true,
      naturalHeight: positiveNumber(image.naturalHeight),
      naturalWidth: positiveNumber(image.naturalWidth),
      rotation: finiteNumber(image.rotation) ?? 0,
      url: image.url,
      showCaption: image.showCaption,
    })),
  )
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function rotationValue(value: unknown) {
  return finiteNumber(value) ?? 0
}

function positiveNumber(value: unknown) {
  const number = finiteNumber(value)
  return number !== null && number > 0 ? number : null
}

import { getMediaPresentation } from "@/lib/mediaPresentation"
