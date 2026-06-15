"use client"

import { ImageIcon, Loader2 } from "lucide-react"
import { ChangeEvent, useRef, useState } from "react"

import {
  ImagePreviewModal,
  type UploadedImage,
} from "@/components/editor/ImagePreviewModal"
import type { GalleryImage } from "@/components/editor/gallery"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"

interface MediaUploadProps {
  onInsertGallery: (images: GalleryImage[]) => void
  onInsertSingle: (url: string, alt: string) => void
  onInsertVideo?: (url: string) => void
}

function getUploadError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Upload failed"
}

function getUploadUrl(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "url" in value.data &&
    typeof value.data.url === "string"
  ) {
    return value.data.url
  }

  return null
}

function getUploadUrls(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null
  ) {
    if (
      "files" in value.data &&
      Array.isArray(value.data.files)
    ) {
      return value.data.files.flatMap((file) => {
        if (
          typeof file === "object" &&
          file !== null &&
          "url" in file &&
          typeof file.url === "string"
        ) {
          return [file.url]
        }

        return []
      })
    }

    const url = getUploadUrl(value)
    return url ? [url] : []
  }

  return []
}

async function uploadFiles(files: readonly File[]) {
  const form = new FormData()
  files.forEach((file) => form.append("file", file))
  form.append("folder", "content-images")

  const response = await fetch("/api/upload", { body: form, method: "POST" })
  const result: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getUploadError(result))
  }

  const urls = getUploadUrls(result)

  if (urls.length !== files.length) {
    throw new Error("Upload failed")
  }

  return urls
}

export function MediaUpload({
  onInsertGallery,
  onInsertSingle,
  onInsertVideo,
}: MediaUploadProps) {
  const [previews, setPreviews] = useState<UploadedImage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setUploading(true)

    try {
      const urls = await uploadFiles(files)

      if (files.length === 1) {
        if (files[0].type.startsWith("video/") && onInsertVideo) {
          onInsertVideo(urls[0])
          return
        }

        const alt =
          window.prompt("Alt text for this image (leave blank to skip):") ?? ""
        onInsertSingle(urls[0], alt)
        return
      }

      const imageFiles = files.filter(f => f.type.startsWith("image/"))
      const videoFiles = files.filter(f => f.type.startsWith("video/"))

      if (onInsertVideo) {
        videoFiles.forEach((f, i) => onInsertVideo(urls[files.indexOf(f)]))
      }

      if (imageFiles.length === 0) {
        return
      }

      setPreviews(
        imageFiles.map((file, index) => ({
          alt: "",
          caption: "",
          file,
          id: `${file.name}-${file.lastModified}-${index}`,
          url: urls[files.indexOf(file)],
        })),
      )
      setShowPreview(true)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  function handleConfirm(
    images: UploadedImage[],
    mode: "individual" | "gallery",
  ) {
    setShowPreview(false)
    setPreviews([])

    if (mode === "individual") {
      images.forEach((image) => onInsertSingle(image.url, image.alt))
      return
    }

    onInsertGallery(
      images.map((image) => ({
        alt: image.alt,
        caption: image.caption,
        url: image.url,
      })),
    )
  }

  return (
    <>
      <button
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary disabled:opacity-40"
        disabled={uploading}
        onMouseDown={(event) => {
          event.preventDefault()
          inputRef.current?.click()
        }}
        title="Insert media"
        type="button"
      >
        {uploading ? (
          <Loader2 aria-hidden="true" className="h-[15px] w-[15px] animate-spin" />
        ) : (
          <ImageIcon aria-hidden="true" className="h-[15px] w-[15px]" />
        )}
      </button>
      <input
        accept={ACCEPTED_TYPES}
        className="hidden"
        multiple
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      {showPreview ? (
        <ImagePreviewModal
          images={previews}
          onClose={() => {
            setShowPreview(false)
            setPreviews([])
          }}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  )
}
