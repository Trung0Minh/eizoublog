"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

import { AnimatePresence } from "motion/react"

import {
  ImageLightbox,
  type LightboxImage,
} from "@/components/posts/ImageLightbox"
import {
  getMediaPresentation,
  getNativeVideoFrameStyle,
} from "@/lib/mediaPresentation"
import { cn } from "@/lib/utils"

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

function syncRotatedImage(image: HTMLImageElement) {
  if (image.dataset.naturalWidth && image.dataset.naturalHeight) {
    return
  }

  const rotation = Number(image.dataset.imageRotation ?? 0)

  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return
  }

  const wrapper = image.parentElement
  if (!wrapper) {
    return
  }

  const { imageStyle, wrapperStyle } = getMediaPresentation({
    flipX: image.dataset.flipX,
    flipY: image.dataset.flipY,
    naturalHeight: image.naturalHeight,
    naturalWidth: image.naturalWidth,
    rotation,
  })

  if (!wrapperStyle) {
    return
  }

  Object.assign(wrapper.style, wrapperStyle)
  Object.assign(image.style, imageStyle)
}

function syncNativeVideo(video: HTMLVideoElement) {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) return

  const frame = video.closest<HTMLElement>("[data-native-video-frame]")
  if (!frame) return

  Object.assign(
    frame.style,
    getNativeVideoFrameStyle({
      naturalHeight: video.videoHeight,
      naturalWidth: video.videoWidth,
    }),
  )
}

export function PostImageInteractions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
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
        syncRotatedImage(image)
      })
      container
        .querySelectorAll<HTMLVideoElement>("video[data-native-video]")
        .forEach((video) => {
          syncNativeVideo(video)
        })
    }

    syncFocusableImages()

    const handleMediaLoad = (event: Event) => {
      const media = event.target
      if (media instanceof HTMLImageElement) {
        syncRotatedImage(media)
      } else if (media instanceof HTMLVideoElement) {
        syncNativeVideo(media)
      }
    }

    container.addEventListener("load", handleMediaLoad, true)
    container.addEventListener("loadedmetadata", handleMediaLoad, true)

    const observer = new MutationObserver(syncFocusableImages)
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      container.removeEventListener("load", handleMediaLoad, true)
      container.removeEventListener("loadedmetadata", handleMediaLoad, true)
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
        transform: image.style.transform || undefined,
        transformOrigin: image.style.transformOrigin || undefined,
      })),
      index,
    })

    return true
  }

  return (
    <>
      <div
        className={cn("post-content mx-auto w-full", className)}
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
