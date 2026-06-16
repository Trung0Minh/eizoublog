"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface AvatarUploadProps {
  name: string
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

  return "Tải ảnh đại diện lên thất bại"
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

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  )
}

export function AvatarUpload({ name, onChange, value }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "avatars")

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
        throw new Error("Phản hồi tải lên không chứa URL ảnh")
      }

      onChange(url)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Tải ảnh đại diện lên thất bại",
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted">
        {value ? (
          <img
            alt={`${name} avatar`}
            className="h-full w-full object-cover"
            src={value}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
            {getInitials(name)}
          </div>
        )}
        <button
          aria-label="Thay đổi ảnh đại diện"
          className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            {uploading ? "Đang tải lên..." : "Tải ảnh đại diện mới"}
          </Button>
          {value && (
            <Button
              onClick={() => onChange("")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, GIF hoặc WebP. Ảnh được hiển thị dưới dạng hình tròn.
        </p>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp"
          aria-label="Tải ảnh đại diện lên"
          className="sr-only"
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
    </div>
  )
}
