"use client"

import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

export interface LightboxImage {
  alt: string
  caption?: string
  src: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [mounted, setMounted] = useState(false)
  const current = images[index]
  const hasNext = index < images.length - 1
  const hasPrevious = index > 0

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const previous = useCallback(() => {
    if (!hasPrevious) {
      return
    }

    setIndex((currentIndex) => currentIndex - 1)
    setScale(1)
  }, [hasPrevious])

  const next = useCallback(() => {
    if (!hasNext) {
      return
    }

    setIndex((currentIndex) => currentIndex + 1)
    setScale(1)
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

      <div className="absolute right-16 top-4 z-10 flex gap-1">
        <button
          aria-label="Zoom in"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          disabled={scale >= 3}
          onClick={(event) => {
            event.stopPropagation()
            setScale((currentScale) => Math.min(currentScale + 0.5, 3))
          }}
          type="button"
        >
          <ZoomIn aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          aria-label="Zoom out"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          disabled={scale <= 0.5}
          onClick={(event) => {
            event.stopPropagation()
            setScale((currentScale) => Math.max(currentScale - 0.5, 0.5))
          }}
          type="button"
        >
          <ZoomOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {hasPrevious ? (
        <button
          aria-label="Previous image"
          className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={(event) => {
            event.stopPropagation()
            previous()
          }}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </button>
      ) : null}

      <div
        className="flex h-full w-full items-center justify-center overflow-hidden touch-none"
        onClick={(event) => event.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation()
          if (e.deltaY < 0) {
            setScale((s) => Math.min(s + 0.25, 4))
          } else {
            const target = e.currentTarget;
            setScale((s) => {
              const newScale = Math.max(s - 0.25, 0.5); // Allow zooming out to 0.5x
              if (newScale <= 1) {
                target.dataset.posX = "0"
                target.dataset.posY = "0"
                const img = target.querySelector('img')
                if (img) img.style.transform = `translate(0px, 0px) scale(${newScale})`
              }
              return newScale
            })
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.dataset.isDragging = "true";
          e.currentTarget.dataset.startX = e.clientX.toString();
          e.currentTarget.dataset.startY = e.clientY.toString();
          e.currentTarget.dataset.scrollLeft = e.currentTarget.scrollLeft.toString();
          e.currentTarget.dataset.scrollTop = e.currentTarget.scrollTop.toString();
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.dataset.isDragging !== "true") return;
          const startX = parseFloat(e.currentTarget.dataset.startX || "0");
          const startY = parseFloat(e.currentTarget.dataset.startY || "0");
          const startPosX = parseFloat(e.currentTarget.dataset.startPosX || "0");
          const startPosY = parseFloat(e.currentTarget.dataset.startPosY || "0");
          const newX = startPosX + (e.clientX - startX);
          const newY = startPosY + (e.clientY - startY);
          e.currentTarget.dataset.posX = newX.toString();
          e.currentTarget.dataset.posY = newY.toString();
          
          const img = e.currentTarget.querySelector('img');
          if (img) {
            img.style.transform = `translate(${newX}px, ${newY}px) scale(${scale})`;
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.dataset.isDragging = "false";
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          e.currentTarget.dataset.isDragging = "false";
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          alt={current.alt || "Expanded post image"}
          className="max-h-[80vh] max-w-[90vw] select-none rounded object-contain transition-transform duration-100 ease-linear"
          draggable={false}
          src={current.src}
          style={{
            transform: `translate(0px, 0px) scale(${scale})`,
          }}
        />
      </div>

      {current.caption ? (
        <p className="mt-4 max-w-2xl px-4 text-center font-sans text-sm text-white/75">
          {current.caption}
        </p>
      ) : null}

      {hasNext ? (
        <button
          aria-label="Next image"
          className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
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
