"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

import { AnimatePresence } from "motion/react"

import {
  ImageLightbox,
  type LightboxImage,
} from "@/components/posts/ImageLightbox"

interface LightboxState {
  images: LightboxImage[]
  index: number
}

function getImageCaption(image: HTMLImageElement) {
  const caption = image
    .closest("figure")
    ?.querySelector("figcaption")
    ?.textContent
    ?.trim()

  return caption || undefined
}

export function PostImageInteractions({
  children,
}: {
  children: ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  useEffect(() => {
    const container = contentRef.current
    if (!container) {
      return
    }

    const syncFocusableImages = () => {
      container.querySelectorAll("img").forEach((image) => {
        image.setAttribute("tabindex", "0")
      })
    }

    syncFocusableImages()

    const observer = new MutationObserver(syncFocusableImages)
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  function openLightboxFromTarget(target: EventTarget | null) {
    const container = contentRef.current
    if (!container || !(target instanceof Element)) {
      return false
    }

    const selectedImage = target.closest("img")
    if (!(selectedImage instanceof HTMLImageElement)) {
      return false
    }

    const images = Array.from(container.querySelectorAll("img"))
    const index = images.indexOf(selectedImage)
    if (index === -1) {
      return false
    }

    setLightbox({
      images: images.map((image) => ({
        alt: image.alt,
        caption: getImageCaption(image),
        src: image.src,
      })),
      index,
    })

    return true
  }

  return (
    <>
      <div
        className="post-content mx-auto w-full"
        onClick={(event) => openLightboxFromTarget(event.target)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return
          }

          if (openLightboxFromTarget(event.target)) {
            event.preventDefault()
          }
        }}
        ref={contentRef}
      >
        {children}
      </div>

      <AnimatePresence>
        {lightbox ? (
          <ImageLightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
