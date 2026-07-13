"use client"

import { Loader2, Plus } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { uploadFilesThroughServer } from "@/components/editor/MediaUpload"
import type { GalleryImage } from "@/components/editor/gallery"

const ACCEPTED_MEDIA = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"

export function GalleryAddMediaButton({
  onAdd,
}: {
  onAdd: (images: GalleryImage[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadSelectedFiles(files: File[]) {
    if (files.length === 0) {
      return
    }

    setUploading(true)
    try {
      const urls = await uploadFilesThroughServer(files, () => undefined)
      onAdd(
        urls.map((url) => ({
          alt: "",
          caption: "",
          showCaption: false,
          url,
        })),
      )
    } catch (error) {
      toast.error("Could not add media", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <button
        aria-label="Add media"
        className="rounded p-1.5 text-sm text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        title="Add media"
        type="button"
      >
        {uploading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Plus aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
      <input
        accept={ACCEPTED_MEDIA}
        className="hidden"
        multiple
        onChange={(event) =>
          void uploadSelectedFiles(Array.from(event.target.files ?? []))
        }
        ref={inputRef}
        type="file"
      />
    </>
  )
}
