"use client"

import { ImageIcon } from "lucide-react"
import { ChangeEvent, useRef, useState } from "react"
import { toast } from "sonner"

import type { GalleryImage } from "@/components/editor/gallery"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"

interface MediaUploadProps {
  onInsertGallery?: (images: GalleryImage[]) => void
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

export function uploadFiles(
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
      const uploadedSizes = new Array(files.length).fill(0)
      
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

export async function uploadFilesThroughServer(
  files: readonly File[],
  onProgress: (percent: number) => void,
) {
  const form = new FormData()
  form.set("folder", "content-images")
  files.forEach((file) => form.append("file", file))

  onProgress(0)
  const response = await fetch("/api/upload", {
    body: form,
    method: "POST",
  })
  const result: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getUploadError(result))
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    typeof result.data !== "object" ||
    result.data === null
  ) {
    throw new Error("Upload returned an invalid response")
  }

  let urls: string[] = []
  if ("url" in result.data && typeof result.data.url === "string") {
    urls = [result.data.url]
  } else if ("files" in result.data && Array.isArray(result.data.files)) {
    urls = result.data.files.flatMap((file) =>
      typeof file === "object" &&
      file !== null &&
      "url" in file &&
      typeof file.url === "string"
        ? [file.url]
        : [],
    )
  }

  if (urls.length !== files.length) {
    throw new Error("Upload returned an invalid response")
  }

  onProgress(100)
  return urls
}

export function MediaUpload({
  onInsertGallery,
  onInsertSingle,
  onInsertVideo,
}: MediaUploadProps) {
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

      const mediaFiles = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"))

      if (mediaFiles.length > 1 && onInsertGallery) {
        onInsertGallery(mediaFiles.map(f => ({ url: urls[files.indexOf(f)], caption: "", alt: "" })))
      } else if (mediaFiles.length === 1) {
        const file = mediaFiles[0]
        if (file.type.startsWith("video/") && onInsertVideo) {
          onInsertVideo(urls[files.indexOf(file)])
        } else {
          onInsertSingle(urls[files.indexOf(file)], "")
        }
      }
    } catch (error) {
      toast.error("Media upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setUploadProgress(null)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <button
        aria-busy={uploadProgress !== null}
        aria-label={
          uploadProgress !== null
            ? `Uploading media ${uploadProgress}%`
            : "Insert media"
        }
        className="relative flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary disabled:cursor-wait disabled:opacity-100"
        disabled={uploadProgress !== null}
        onMouseDown={(event) => {
          event.preventDefault()
          inputRef.current?.click()
        }}
        title={uploadProgress !== null ? "Uploading media" : "Insert media"}
        type="button"
      >
        {uploadProgress !== null ? (
          <span
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={uploadProgress}
            className="relative flex h-5 w-5 items-center justify-center"
            role="progressbar"
          >
            <span className="absolute inset-0 rounded-full border-2 border-accent/25" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-accent border-t-accent [filter:drop-shadow(0_0_4px_var(--accent))]" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
            <span className="sr-only">Uploading media {uploadProgress}%</span>
          </span>
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
    </>
  )
}
