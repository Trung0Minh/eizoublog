"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, X } from "lucide-react"

interface CoverImageUploadProps {
  onChange: (url: string) => void
  value: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Lỗi tải lên ảnh bìa"
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

export function CoverImageUpload({ onChange, value }: CoverImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "covers")

      const response = await fetch("/api/upload", {
        body: formData,
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const url = getUploadUrl(result)

      if (!url) {
        throw new Error("Phản hồi tải lên không bao gồm URL")
      }

      onChange(url)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Lỗi tải lên ảnh bìa",
      )
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-2.5">
      <label className="block text-[12px] font-semibold text-text-secondary" htmlFor="cover-image">
        Ảnh bìa
      </label>

      {value ? (
        <div className="space-y-3">
          <div className="group relative aspect-video w-full overflow-hidden rounded-[8px] border border-border-default bg-subtle-bg">
            <img
              alt="Ảnh bìa đã chọn"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50"}% ${new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50"}%`,
                transform: `scale(${new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"})`,
              }}
              src={value.split("?")[0]}
            />
            <button
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <Camera aria-hidden="true" className="mb-2 h-6 w-6" />
              <span className="text-[13px] font-medium">Thay đổi</span>
            </button>
            <button
              aria-label="Xóa ảnh bìa"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
              onClick={() => onChange("")}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2 rounded-[6px] border border-border-default/50 bg-subtle-bg/30 p-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-text-secondary flex justify-between" htmlFor="cover-zoom">
                <span>Thu phóng (Zoom)</span>
                <span>{new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"}x</span>
              </label>
              <input
                type="range"
                id="cover-zoom"
                min="1"
                max="3"
                step="0.1"
                value={new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"}
                onChange={(e) => {
                  const [base, query] = (value || "").split("?")
                  const params = new URLSearchParams(query || "")
                  params.set("zoom", e.target.value)
                  onChange(`${base}?${params.toString()}`)
                }}
                className="w-full accent-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[11px] font-medium text-text-secondary flex justify-between" htmlFor="cover-position-x">
                <span>Căn ngang (Trái - Phải)</span>
                <span>{new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50"}%</span>
              </label>
              <input
                type="range"
                id="cover-position-x"
                min="0"
                max="100"
                value={new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50"}
                onChange={(e) => {
                  const [base, query] = (value || "").split("?")
                  const params = new URLSearchParams(query || "")
                  params.set("posX", e.target.value)
                  onChange(`${base}?${params.toString()}`)
                }}
                className="w-full accent-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[11px] font-medium text-text-secondary flex justify-between" htmlFor="cover-position-y">
                <span>Căn dọc (Trên - Dưới)</span>
                <span>{new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50"}%</span>
              </label>
              <input
                type="range"
                id="cover-position-y"
                min="0"
                max="100"
                value={new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50"}
                onChange={(e) => {
                  const [base, query] = (value || "").split("?")
                  const params = new URLSearchParams(query || "")
                  params.set("posY", e.target.value)
                  onChange(`${base}?${params.toString()}`)
                }}
                className="w-full accent-accent"
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          className="flex aspect-video w-full flex-col items-center justify-center rounded-[8px] border-[1.5px] border-dashed border-border-strong bg-subtle-bg p-4 text-center transition-colors hover:border-text-secondary hover:bg-border-default/30"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-text-tertiary" />
          ) : (
            <ImagePlus aria-hidden="true" className="h-6 w-6 text-text-tertiary" />
          )}
          <span className="mt-2 text-[13px] text-text-secondary">
            {uploading ? "Đang tải lên..." : "Thêm ảnh bìa"}
          </span>
          <span className="mt-1 text-[11px] text-text-tertiary">
            JPG, PNG, GIF, WebP · Tối đa 10MB
          </span>
        </button>
      )}

      <input
        accept="image/jpeg,image/png,image/gif,image/webp"
        aria-label="Tải lên ảnh bìa"
        className="sr-only"
        id="cover-image"
        onChange={(event) => {
          const file = event.target.files?.[0]

          if (file) {
            void handleFile(file)
          }
        }}
        ref={inputRef}
        type="file"
      />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
