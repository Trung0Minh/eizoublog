export interface GalleryImage {
  alt: string
  caption: string
  url: string
  showCaption?: boolean
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
      url: image.url,
      showCaption: image.showCaption,
    })),
  )
}
