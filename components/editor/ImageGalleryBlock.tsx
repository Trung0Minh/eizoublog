"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { ArrowLeft, ArrowRight, Trash2, Type } from "lucide-react"

import {
  getGalleryImageAlt,
  parseGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

export function ImageGalleryBlock({ node, updateAttributes, editor, selected, deleteNode }: NodeViewProps) {
  const images = parseGalleryImages(node.attrs.images)
  const columns = node.attrs.columns || 2

  function updateImage(index: number, newImage: Partial<GalleryImage>) {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], ...newImage }
    updateAttributes({ images: serializeGalleryImages(newImages) })
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index)
    if (newImages.length === 0) {
      deleteNode()
    } else {
      updateAttributes({ images: serializeGalleryImages(newImages) })
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= images.length) return
    const newImages = [...images]
    const temp = newImages[index]
    newImages[index] = newImages[index + direction]
    newImages[index + direction] = temp
    updateAttributes({ images: serializeGalleryImages(newImages) })
  }

  return (
    <NodeViewWrapper
      className={`image-gallery relative group ${selected ? "ring-2 ring-accent rounded-md" : ""}`}
      data-type="image-gallery"
    >
      {editor.isEditable && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
          <span className="px-2 text-xs font-medium text-text-secondary">Columns:</span>
          {[1, 2, 3, 4].map((col) => (
            <button
              key={col}
              type="button"
              className={`flex h-6 w-6 items-center justify-center rounded text-sm ${columns === col ? "bg-subtle-bg text-text-primary" : "text-text-secondary hover:bg-subtle-bg"}`}
              onClick={() => updateAttributes({ columns: col })}
            >
              {col}
            </button>
          ))}
        </div>
      )}

      {images.length > 0 ? (
        <div className="image-gallery__grid" style={{ gridTemplateColumns: `repeat(${Math.min(columns, images.length)}, minmax(0, 1fr))` }}>
          {images.map((image, index) => {
            const isVideoUrl = image.url.match(/\.(mp4|webm)$/i) || image.url.includes("youtube.com") || image.url.includes("youtu.be")
            const isNative = isNativeVideo(image.url)

            return (
              <figure className="image-gallery__item relative group/item" key={image.url + index}>
                {editor.isEditable && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-opacity duration-200">
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                      title="Move Left/Up"
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      title="Move Right/Down"
                      type="button"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-border-default" />
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg"
                      onClick={() => {
                        const caption = window.prompt("Caption for this media:", image.caption || "")
                        if (caption !== null) {
                          const alt = window.prompt("Alt text (leave empty to reuse caption):", image.alt || caption || "")
                          updateImage(index, { alt: alt !== null ? alt : image.alt, caption })
                        }
                      }}
                      title="Edit Alt/Caption"
                      type="button"
                    >
                      <Type className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-sm text-red-500 hover:bg-red-500/10"
                      onClick={() => removeImage(index)}
                      title="Remove from Gallery"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {isVideoUrl ? (
                  <div className="relative w-full h-full aspect-video">
                    {isNative ? (
                      <video
                        className="absolute inset-0 h-full w-full rounded-md object-contain bg-black/5"
                        controls
                        preload="metadata"
                        src={image.url}
                        title={getGalleryImageAlt(image)}
                      />
                    ) : (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full rounded-md"
                        loading="lazy"
                        src={toVideoEmbedUrl(image.url)}
                        title={getGalleryImageAlt(image)}
                      />
                    )}
                  </div>
                ) : (
                  <img
                    alt={getGalleryImageAlt(image)}
                    className="image-gallery__image"
                    decoding="async"
                    loading="lazy"
                    src={image.url}
                  />
                )}

                {image.caption ? (
                  <figcaption className="image-gallery__caption">
                    {image.caption}
                  </figcaption>
                ) : null}
              </figure>
            )
          })}
        </div>
      ) : (
        <p className="m-0 rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
          Empty image gallery
        </p>
      )}
    </NodeViewWrapper>
  )
}
