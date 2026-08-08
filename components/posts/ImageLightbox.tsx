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

      if (event.key === "ArrowLeft") {
        previous()
      }

      if (event.key === "ArrowRight") {
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4"
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
        maxScale={4}
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
              className="flex h-full w-full items-center justify-center overflow-hidden touch-none"
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
                  className="flex max-h-[80vh] max-w-[90vw] items-center justify-center"
                >
                  <img
                    alt={current.alt || "Expanded post image"}
                    className="max-h-[80vh] max-w-[90vw] select-none rounded object-contain"
                    draggable={false}
                    src={current.src}
                    style={{
                      transform: current.transform,
                      transformOrigin: current.transformOrigin,
                    }}
                  />
                </motion.div>
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>

      {current.caption ? (
        <p className="mt-4 max-w-2xl px-4 text-center font-sans text-sm text-white/75">
          {current.caption}
        </p>
      ) : null}

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
