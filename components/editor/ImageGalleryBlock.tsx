"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash2, Type } from "lucide-react"

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

  function moveImage(index: number, direction: number) {
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
            const isNative = isNativeVideo(image.url)
            const isVideoUrl = isNative || image.url.includes("youtube.com") || image.url.includes("youtu.be")

            return (
              <figure className="image-gallery__item relative group/item" key={image.url + index}>
                {editor.isEditable && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-opacity duration-200">
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                      title="Move Left"
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index - columns < 0}
                      onClick={() => moveImage(index, -columns)}
                      title="Move Up"
                      type="button"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index + columns >= images.length}
                      onClick={() => moveImage(index, columns)}
                      title="Move Down"
                      type="button"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      title="Move Right"
                      type="button"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-border-default" />
                    <button
                      className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
                        image.showCaption ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
                      }`}
                      onClick={() => updateImage(index, { showCaption: !image.showCaption })}
                      title="Toggle Caption"
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

                {editor.isEditable ? (
                  <figcaption
                    className={`image-gallery__caption !mt-1 ${!image.showCaption ? "hidden" : ""}`}
                  >
                    <input
                      className="w-full bg-transparent text-center outline-none border-none placeholder:text-text-tertiary/50"
                      placeholder="Write a caption..."
                      value={image.caption}
                      onChange={(e) => updateImage(index, { caption: e.target.value })}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </figcaption>
                ) : image.showCaption !== false && image.caption ? (
                  <figcaption className="image-gallery__caption !mt-1">
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
