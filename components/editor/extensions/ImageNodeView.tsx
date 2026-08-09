import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { AnimatePresence } from "motion/react"
import { useRef, useState, type CSSProperties, type SyntheticEvent } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
  Trash2,
  Type,
  ZoomIn,
} from "lucide-react"

import { GalleryAddMediaButton } from "@/components/editor/GalleryAddMediaButton"
import { serializeGalleryImages } from "@/components/editor/gallery"
import { ImageLightbox } from "@/components/posts/ImageLightbox"

function normalizeRotation(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? ((value % 360) + 360) % 360
    : 0
}

function rawRotation(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function positiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null
}

function getRotatedImageFit(attrs: Record<string, unknown>) {
  const rotation = normalizeRotation(attrs.rotation)
  const naturalWidth = positiveNumber(attrs.naturalWidth)
  const naturalHeight = positiveNumber(attrs.naturalHeight)
  const isQuarterTurn = rotation === 90 || rotation === 270

  if (!isQuarterTurn || !naturalWidth || !naturalHeight) {
    return {
      imageScale: 1,
      wrapperStyle: undefined,
    }
  }

  return {
    imageScale: naturalWidth / naturalHeight,
    wrapperStyle: {
      alignItems: "center",
      aspectRatio: `${naturalHeight} / ${naturalWidth}`,
      display: "flex",
      justifyContent: "center",
      overflow: "hidden",
      width: "100%",
    } satisfies CSSProperties,
  }
}

export function ImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props
  const captionRef = useRef<HTMLElement>(null)
  const [zoomOpen, setZoomOpen] = useState(false)
  const rotation = rawRotation(node.attrs.rotation)
  const flipX = node.attrs.flipX === true
  const flipY = node.attrs.flipY === true
  const { imageScale, wrapperStyle } = getRotatedImageFit(node.attrs)
  const imageTransform = `rotate(${rotation}deg) scale(${imageScale * (flipX ? -1 : 1)}, ${imageScale * (flipY ? -1 : 1)})`
  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget

    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return
    }

    if (
      node.attrs.naturalWidth !== naturalWidth ||
      node.attrs.naturalHeight !== naturalHeight
    ) {
      updateAttributes({ naturalHeight, naturalWidth })
    }
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`relative group flex flex-col items-center ${
        node.attrs.align === "left"
          ? "float-left mr-6 mb-4 mt-2 clear-left"
          : node.attrs.align === "right"
          ? "float-right ml-6 mb-4 mt-2 clear-right"
          : "justify-center my-2 clear-both"
      }`}
      style={{
        width: node.attrs.align !== "center" ? node.attrs.width : "100%",
        maxWidth: "100%",
      }}
    >
      {/* Mini toolbar that appears on select/hover */}
      {props.editor.isEditable && (
        <div className={`absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 transition-opacity duration-200 ${selected ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "left" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "left", width: "50%" })}
            title="Align Left"
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "center" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "center", width: "100%" })}
            title="Align Center"
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "right" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "right", width: "50%" })}
            title="Align Right"
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
            onClick={() => updateAttributes({ rotation: rotation - 90 })}
            title="Rotate left"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
            onClick={() => updateAttributes({ rotation: rotation + 90 })}
            title="Rotate right"
            type="button"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              flipX ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ flipX: !flipX })}
            title="Flip horizontal"
            type="button"
          >
            <FlipHorizontal2 className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              flipY ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ flipY: !flipY })}
            title="Flip vertical"
            type="button"
          >
            <FlipVertical2 className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
            onClick={() => setZoomOpen(true)}
            title="Zoom image"
            type="button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.showCaption ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => {
              const nextState = !node.attrs.showCaption;
              updateAttributes({ showCaption: nextState });
              if (nextState) {
                setTimeout(() => {
                  const editable = captionRef.current?.querySelector('[contenteditable]') as HTMLElement;
                  if (editable) editable.focus();
                  else captionRef.current?.focus();
                }, 50);
              }
            }}
            title="Toggle Caption"
            type="button"
          >
            <Type className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <GalleryAddMediaButton
            onAdd={(newImages) => {
              const position = props.getPos()
              const galleryType = props.editor.schema.nodes.imageGallery
              if (typeof position !== "number" || !galleryType) {
                return
              }

              const originalImage = {
                alt: typeof node.attrs.alt === "string" ? node.attrs.alt : "",
                caption: node.textContent,
                flipX: node.attrs.flipX === true,
                flipY: node.attrs.flipY === true,
                naturalHeight: positiveNumber(node.attrs.naturalHeight),
                naturalWidth: positiveNumber(node.attrs.naturalWidth),
                rotation: rawRotation(node.attrs.rotation),
                showCaption: node.attrs.showCaption === true,
                url: typeof node.attrs.src === "string" ? node.attrs.src : "",
              }
              const galleryNode = galleryType.create({
                columns: 2,
                images: serializeGalleryImages([originalImage, ...newImages]),
                layout: "grid",
              })

              props.editor.view.dispatch(
                props.editor.state.tr.replaceWith(
                  position,
                  position + node.nodeSize,
                  galleryNode,
                ),
              )
              props.editor.commands.focus()
            }}
          />
          <div className="mx-1 h-4 w-px bg-border-default" />

          <button
            className="rounded p-1.5 text-sm text-red-500 hover:bg-red-500/10"
            onClick={() => props.deleteNode()}
            title="Delete Image"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="w-full" style={wrapperStyle}>
        <img
          alt={node.attrs.alt || "Image"}
          className={`!m-0 h-auto w-full rounded-md object-contain transition-[box-shadow,transform] duration-200 ease-out ${
            selected ? "ring-2 ring-accent" : ""
          }`}
          onLoad={handleImageLoad}
          src={node.attrs.src}
          style={{
            transform: imageTransform,
            transformOrigin: "center",
          }}
        />
      </div>
      <figcaption
        ref={captionRef}
        className={`editor-media-caption mt-2 w-full text-center text-sm italic ${
          props.editor.isEditable ? "min-h-[1.5rem] outline-none" : ""
        } ${!node.attrs.showCaption ? "hidden" : ""}`}
      >
        <NodeViewContent />
      </figcaption>
      <AnimatePresence>
        {zoomOpen && typeof node.attrs.src === "string" ? (
          <ImageLightbox
            images={[
              {
                alt:
                  typeof node.attrs.alt === "string"
                    ? node.attrs.alt
                    : "Expanded post image",
                caption: node.textContent.trim() || undefined,
                src: node.attrs.src,
                transform: imageTransform,
                transformOrigin: "center",
              },
            ]}
            initialIndex={0}
            onClose={() => setZoomOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </NodeViewWrapper>
  )
}
