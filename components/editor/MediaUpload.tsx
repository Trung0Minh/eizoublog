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

function uploadFiles(
  files: readonly File[],
  onProgress: (percent: number) => void,
): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Get presigned URLs
      const metadata = files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      const res = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "content-images", files: metadata })
      })
      const presignResult: unknown = await res.json()
      
      if (!res.ok) {
        throw new Error(getUploadError(presignResult))
      }

      let presignedData: Array<{ uploadUrl: string, publicUrl: string }> = []
      if (
        typeof presignResult === "object" &&
        presignResult !== null &&
        "data" in presignResult &&
        typeof presignResult.data === "object" &&
        presignResult.data !== null &&
        "files" in presignResult.data &&
        Array.isArray(presignResult.data.files)
      ) {
        presignedData = presignResult.data.files
      }

      if (presignedData.length !== files.length) {
        throw new Error("Failed to get presigned URLs")
      }

      // 2. Upload files tracking overall progress
      const totalSize = files.reduce((acc, f) => acc + f.size, 0)
      let uploadedSizes = new Array(files.length).fill(0)
      
      const uploadPromises = files.map((file, i) => {
        return new Promise<string>((resolveUpload, rejectUpload) => {
          const xhr = new XMLHttpRequest()
          xhr.open("PUT", presignedData[i].uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              uploadedSizes[i] = event.loaded
              const currentTotal = uploadedSizes.reduce((a, b) => a + b, 0)
              const percent = Math.round((currentTotal / totalSize) * 100)
              onProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolveUpload(presignedData[i].publicUrl)
            } else {
              rejectUpload(new Error("Failed to upload to storage"))
            }
          }

          xhr.onerror = () => rejectUpload(new Error("Upload failed due to network error"))
          xhr.send(file)
        })
      })

      const finalUrls = await Promise.all(uploadPromises)
      resolve(finalUrls)
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Upload failed"))
    }
  })
}

export function MediaUpload({
  onInsertGallery,
  onInsertSingle,
  onInsertVideo,
}: MediaUploadProps) {
  const [previews, setPreviews] = useState<UploadedImage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setUploadProgress(0)

    try {
      const urls = await uploadFiles(files, (percent) => setUploadProgress(percent))

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
      setUploadProgress(null)
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
        className="relative flex h-[30px] w-[30px] overflow-hidden items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary disabled:opacity-40"
        disabled={uploadProgress !== null}
        onMouseDown={(event) => {
          event.preventDefault()
          inputRef.current?.click()
        }}
        title="Insert media"
        type="button"
      >
        {uploadProgress !== null ? (
          <>
            <div 
              className="absolute bottom-0 left-0 bg-accent/20 transition-all duration-200" 
              style={{ height: `${uploadProgress}%`, width: '100%' }}
            />
            <span className="relative z-10 text-[10px] font-bold text-accent">{uploadProgress}%</span>
          </>
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
