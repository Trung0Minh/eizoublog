"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { GalleryHorizontal, Grid2X2, GripVertical, Trash2, Type } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

import {
  getGalleryImageAlt,
  normalizeGalleryLayout,
  parseGalleryImages,
  reorderGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"
import { GalleryAddMediaButton } from "@/components/editor/GalleryAddMediaButton"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

export function ImageGalleryBlock({ node, updateAttributes, editor, selected, deleteNode }: NodeViewProps) {
  const images = parseGalleryImages(node.attrs.images)
  const columns = node.attrs.columns || 2
  const layout = normalizeGalleryLayout(node.attrs.layout)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const galleryContainerRef = useRef<HTMLDivElement>(null)
  const reorderHandleRef = useRef<HTMLButtonElement | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const hasVisibleCaption = images.some(
    (image) =>
      editor.isEditable
        ? image.showCaption
        : image.caption && image.showCaption !== false,
  )

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

  function reorderImage(fromIndex: number, toIndex: number) {
    const reordered = reorderGalleryImages(images, fromIndex, toIndex)
    if (reordered !== images) {
      updateAttributes({ images: serializeGalleryImages(reordered) })
    }
  }

  function startPointerReorder(
    event: PointerEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    reorderHandleRef.current = event.currentTarget
    setDraggedIndex(index)
    setDropIndex(index)
    dropIndexRef.current = index
  }

  function pickHorizontalImage(index: number) {
    if (draggedIndex === index) {
      finishDragging()
      return
    }

    setDraggedIndex(index)
    setDropIndex(index)
    dropIndexRef.current = index
  }

  function placeHorizontalImage(index: number) {
    if (draggedIndex === null) {
      return
    }

    reorderImage(draggedIndex, index)
    finishDragging()
  }

  function finishDragging() {
    setDraggedIndex(null)
    setDropIndex(null)
    dropIndexRef.current = null
  }

  function handleReorderKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const previousStep = layout === "grid" && event.key === "ArrowUp" ? -columns : -1
    const nextStep = layout === "grid" && event.key === "ArrowDown" ? columns : 1
    const direction =
      event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? previousStep
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? nextStep
          : 0

    if (direction !== 0) {
      event.preventDefault()
      event.stopPropagation()
      reorderImage(index, index + direction)
    }
  }

  useEffect(() => {
    const container = galleryContainerRef.current
    if (draggedIndex === null || layout !== "grid" || !container) {
      return
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      const item = target?.closest<HTMLElement>("[data-gallery-index]")
      if (!item || !container.contains(item)) {
        return
      }

      const index = Number(item.dataset.galleryIndex)
      if (Number.isInteger(index)) {
        dropIndexRef.current = index
        setDropIndex(index)
      }
    }
    const handlePointerUp = (event: globalThis.PointerEvent) => {
      const handle = reorderHandleRef.current
      if (handle?.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId)
      }

      const reordered = reorderGalleryImages(
        images,
        draggedIndex,
        dropIndexRef.current ?? draggedIndex,
      )
      if (reordered !== images) {
        updateAttributes({ images: serializeGalleryImages(reordered) })
      }
      setDraggedIndex(null)
      setDropIndex(null)
      dropIndexRef.current = null
      reorderHandleRef.current = null
    }
    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp, { once: true })
    document.addEventListener("pointercancel", handlePointerUp, { once: true })

    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
      document.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [draggedIndex, images, layout, updateAttributes])

  useEffect(() => {
    if (layout !== "horizontal" || draggedIndex === null) {
      return
    }

    const cancelWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraggedIndex(null)
        setDropIndex(null)
        dropIndexRef.current = null
      }
    }

    document.addEventListener("keydown", cancelWithEscape)
    return () => document.removeEventListener("keydown", cancelWithEscape)
  }, [draggedIndex, layout])

  return (
    <NodeViewWrapper
      className={`image-gallery !my-2 relative group ${selected ? "ring-2 ring-accent rounded-md" : ""}`}
      data-type="image-gallery"
    >
      {editor.isEditable && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
          {layout === "horizontal" && draggedIndex !== null ? (
            <span className="px-2 text-xs font-medium text-text-secondary">
              Choose a new position · Press Escape to cancel
            </span>
          ) : null}
          {layout === "grid" ? (
            <button
              aria-label="Switch gallery to horizontal list"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors duration-200 hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => updateAttributes({ layout: "horizontal" })}
              title="Switch to horizontal list"
              type="button"
            >
              <GalleryHorizontal aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <button
              aria-label="Switch gallery to grid"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-text-secondary transition-colors duration-200 hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => updateAttributes({ layout: "grid" })}
              title="Switch to grid"
              type="button"
            >
              <Grid2X2 aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
          <GalleryAddMediaButton
            onAdd={(newImages) =>
              updateAttributes({
                images: serializeGalleryImages([...images, ...newImages]),
              })
            }
          />
          {layout === "grid" && (
            <>
              <div className="mx-1 h-4 w-px bg-border-default" />
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
            </>
          )}
        </div>
      )}

      {images.length > 0 ? (
        <div
          className={
            `${
              layout === "horizontal"
                ? "image-gallery__horizontal"
                : "image-gallery__grid"
            } ${layout === "grid" && draggedIndex !== null ? "select-none !cursor-grabbing" : ""}`
          }
          style={
            layout === "grid"
              ? {
                  gridTemplateColumns: `repeat(${Math.min(columns, images.length)}, minmax(0, 1fr))`,
                }
              : undefined
          }
          ref={galleryContainerRef}
        >
          {images.map((image, index) => {
            const isNative = isNativeVideo(image.url)
            const isVideoUrl = isNative || image.url.includes("youtube.com") || image.url.includes("youtu.be")
            const showCaption = image.caption && image.showCaption !== false

            return (
              <figure
                className={`image-gallery__item relative group/item transition-[opacity,box-shadow] duration-200 ${
                  draggedIndex === index ? "opacity-45" : "opacity-100"
                } ${dropIndex === index && draggedIndex !== index ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
                data-gallery-index={index}
                key={image.url + index}
              >
                {editor.isEditable && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-opacity duration-200">
                    <button
                      aria-label={`Reorder media ${index + 1}`}
                      aria-pressed={draggedIndex === index}
                      className="cursor-grab rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary active:cursor-grabbing"
                      onKeyDown={(event) => handleReorderKey(event, index)}
                      onClick={() =>
                        layout === "horizontal"
                          ? pickHorizontalImage(index)
                          : undefined
                      }
                      onPointerDown={(event) =>
                        layout === "grid"
                          ? startPointerReorder(event, index)
                          : undefined
                      }
                      title={
                        layout === "grid"
                          ? "Hold and drag to reorder"
                          : draggedIndex === index
                            ? "Cancel moving this media"
                            : "Pick up this media"
                      }
                      type="button"
                    >
                      <GripVertical className="h-4 w-4" />
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

                {editor.isEditable &&
                  layout === "horizontal" &&
                  draggedIndex !== null &&
                  draggedIndex !== index && (
                    <button
                      aria-label={`Place media at position ${index + 1}`}
                      className="absolute inset-0 z-40 flex cursor-pointer items-center justify-center rounded-[4px] border-2 border-dashed border-accent/70 bg-background/55 text-[12px] font-semibold text-accent opacity-0 backdrop-blur-[2px] transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        placeHorizontalImage(index)
                      }}
                      type="button"
                    >
                      Place here
                    </button>
                  )}
                
                {isVideoUrl ? (
                  isNative ? (
                      <video
                        className="h-auto w-full rounded-md bg-black/5"
                        controls
                        preload="metadata"
                        src={image.url}
                        title={getGalleryImageAlt(image)}
                      />
                    ) : (
                      <div className="relative aspect-video w-full">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full rounded-md"
                        loading="lazy"
                        src={toVideoEmbedUrl(image.url)}
                        title={getGalleryImageAlt(image)}
                      />
                      </div>
                    )
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
                  image.showCaption ? (
                    <figcaption className="image-gallery__caption !mt-1">
                      <input
                        autoFocus
                        className="w-full bg-transparent text-center outline-none border-none placeholder:text-text-tertiary/50"
                        placeholder="Write a caption..."
                        value={image.caption}
                        onChange={(e) => updateImage(index, { caption: e.target.value })}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </figcaption>
                  ) : hasVisibleCaption ? (
                    <figcaption
                      aria-hidden="true"
                      className="image-gallery__caption image-gallery__caption--placeholder !mt-1"
                    />
                  ) : null
                ) : showCaption ? (
                  <figcaption className="image-gallery__caption !mt-1">
                    {image.caption}
                  </figcaption>
                ) : hasVisibleCaption ? (
                  <figcaption
                    aria-hidden="true"
                    className="image-gallery__caption image-gallery__caption--placeholder !mt-1"
                  />
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
