"use client"

import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { motion } from "motion/react"
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react"
import { createPortal } from "react-dom"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

export interface LightboxImage {
  alt: string
  caption?: string
  src: string
  transform?: string
  transformOrigin?: CSSProperties["transformOrigin"]
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

const emptySubscribe = () => () => undefined

function getThumbnailTransform(transform?: string) {
  if (!transform) {
    return undefined
  }

  return transform.replace(
    /scale\(\s*(-?)[\d.]+\s*,\s*(-?)[\d.]+\s*\)/,
    (_, scaleX: string, scaleY: string) =>
      `scale(${scaleX ? "-1" : "1"}, ${scaleY ? "-1" : "1"})`,
  )
}

function isQuarterTurn(transform?: string) {
  const rotation = transform?.match(/rotate\(\s*(-?[\d.]+)deg\s*\)/)?.[1]
  if (!rotation) return false

  const normalizedRotation = ((Number(rotation) % 360) + 360) % 360
  return normalizedRotation === 90 || normalizedRotation === 270
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const current = images[index]
  const hasNext = index < images.length - 1
  const hasPrevious = index > 0

  const previous = useCallback(() => {
    if (!hasPrevious) {
      return
    }

    setIndex((currentIndex) => currentIndex - 1)
  }, [hasPrevious])

  const next = useCallback(() => {
    if (!hasNext) {
      return
    }

    setIndex((currentIndex) => currentIndex + 1)
  }, [hasNext])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault()
        previous()
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault()
        next()
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [next, onClose, previous])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  if (!current || !mounted) {
    return null
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Image viewer"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="Close image viewer"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>

      {images.length > 1 ? (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 font-sans text-sm text-white/80">
          {index + 1} / {images.length}
        </div>
      ) : null}

      {hasPrevious ? (
        <button
          aria-label="Previous image"
          className="absolute left-4 z-10 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={(event) => {
            event.stopPropagation()
            previous()
          }}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </button>
      ) : null}

      <TransformWrapper
        key={index}
        initialScale={1}
        minScale={0.5}
        maxScale={10}
        centerOnInit
        doubleClick={{ mode: "zoomIn" }}
        wheel={{ step: 0.005 }}
      >
        {({ zoomIn, zoomOut }) => (
          <>
            <div className="absolute right-16 top-4 z-10 flex gap-1">
              <button
                aria-label="Zoom in"
                className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={(event) => {
                  event.stopPropagation()
                  zoomIn()
                }}
                type="button"
              >
                <ZoomIn aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                aria-label="Zoom out"
                className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={(event) => {
                  event.stopPropagation()
                  zoomOut()
                }}
                type="button"
              >
                <ZoomOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden px-4 py-16 touch-none"
              onClick={(event) => event.stopPropagation()}
            >
              <TransformComponent 
                wrapperClass="w-full h-full flex items-center justify-center"
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex max-h-[calc(100vh-8rem)] max-w-[90vw] flex-col items-center justify-center"
                >
                  <img
                    alt={current.alt || "Expanded post image"}
                    className="max-h-[calc(100vh-11rem)] max-w-[90vw] select-none rounded object-contain"
                    draggable={false}
                    src={current.src}
                    style={{
                      transform: current.transform,
                      transformOrigin: current.transformOrigin,
                    }}
                  />
                  {current.caption ? (
                    <p className="mt-3 max-w-2xl px-4 text-center font-sans text-sm text-white/75">
                      {current.caption}
                    </p>
                  ) : null}
                </motion.div>
              </TransformComponent>

              {images.length > 1 ? (
                <div
                  aria-label="Image thumbnails"
                  className="no-scrollbar absolute bottom-4 left-1/2 z-10 flex max-w-[min(90%,720px)] -translate-x-1/2 gap-2 overflow-x-auto rounded-lg bg-black/45 p-2 backdrop-blur-[2px] sm:bottom-auto sm:left-16 sm:top-1/2 sm:max-h-[min(76vh,640px)] sm:max-w-none sm:-translate-x-0 sm:-translate-y-1/2 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto"
                  role="list"
                >
                  {images.map((image, imageIndex) => {
                    const quarterTurn = isQuarterTurn(image.transform)

                    return (
                      <button
                        aria-label={`View image ${imageIndex + 1}`}
                        aria-current={imageIndex === index ? "true" : undefined}
                        className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border-2 transition-opacity ${
                          imageIndex === index
                            ? "border-white opacity-100"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        key={`${image.src}-${imageIndex}`}
                        onClick={() => setIndex(imageIndex)}
                        type="button"
                      >
                        <img
                          alt=""
                          className={quarterTurn
                            ? "block h-24 w-16 max-w-none object-contain"
                            : "block h-full w-full object-contain"
                          }
                          draggable={false}
                          src={image.src}
                          style={{
                            transform: getThumbnailTransform(image.transform),
                            transformOrigin: image.transformOrigin,
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </>
        )}
      </TransformWrapper>

      {hasNext ? (
        <button
          aria-label="Next image"
          className="absolute right-4 z-10 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={(event) => {
            event.stopPropagation()
            next()
          }}
          type="button"
        >
          <ChevronRight aria-hidden="true" className="h-6 w-6" />
        </button>
      ) : null}
    </motion.div>,
    document.body
  )
}
