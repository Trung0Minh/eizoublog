"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, Loader2, X } from "lucide-react"
import { createPortal } from "react-dom"
import Cropper from "react-easy-crop"

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

// Crops a local object URL to a circular area and returns a Blob
async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement("canvas")
  const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext("2d")!

  // Clip to circle
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Canvas toBlob failed"))
      },
      "image/webp",
      0.9,
    )
  })
}

// ─── Avatar Cropper Modal ────────────────────────────────────────────────────

function AvatarCropperModal({
  localSrc,
  onClose,
  onConfirm,
}: {
  localSrc: string
  onClose: () => void
  onConfirm: (blob: Blob) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  // Scroll wheel → zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.001, 1), 5))
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/90 p-4">
      <button
        aria-label="Đóng"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>

      <div className="mb-6 text-center text-white/80">
        <h3 className="mb-1 text-lg font-medium text-white">Cắt ảnh đại diện</h3>
        <p className="text-sm">Kéo để di chuyển, cuộn chuột để thu phóng</p>
      </div>

      {/* Square container, circle crop overlay */}
      <div
        ref={containerRef}
        className="relative h-[340px] w-[340px] overflow-hidden rounded-full bg-black/50 shadow-2xl ring-2 ring-white/20"
        style={{ borderRadius: "50%" }}
      >
        <Cropper
          image={localSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={(_area, areaPixels) => {
            setCroppedAreaPixels(areaPixels)
          }}
          onZoomChange={setZoom}
          style={{
            containerStyle: { background: "transparent", borderRadius: 0 },
          }}
        />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          className="rounded-md bg-white/10 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          onClick={onClose}
          type="button"
        >
          Hủy
        </button>
        <button
          className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
          onClick={async () => {
            if (!croppedAreaPixels) {
              onClose()
              return
            }
            const blob = await getCroppedBlob(localSrc, croppedAreaPixels)
            onConfirm(blob)
          }}
          type="button"
        >
          Xác nhận
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ─── AvatarUpload ────────────────────────────────────────────────────────────

export function AvatarUpload({ name, onChange, value }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  // localSrc: object URL from the file picker, used in the cropper modal
  const [localSrc, setLocalSrc] = useState<string | null>(null)

  // Clean up object URLs when done
  useEffect(() => {
    return () => {
      if (localSrc) URL.revokeObjectURL(localSrc)
    }
  }, [localSrc])

  function openCropper(file: File) {
    const url = URL.createObjectURL(file)
    setLocalSrc(url)
  }

  async function uploadBlob(blob: Blob) {
    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", blob, "avatar.webp")
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
          JPEG, PNG, GIF hoặc WebP. Kéo và cuộn để cắt vùng ảnh mong muốn.
        </p>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp"
          aria-label="Tải ảnh đại diện lên"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              openCropper(file)
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

      {localSrc && (
        <AvatarCropperModal
          localSrc={localSrc}
          onClose={() => {
            URL.revokeObjectURL(localSrc)
            setLocalSrc(null)
          }}
          onConfirm={async (blob) => {
            URL.revokeObjectURL(localSrc)
            setLocalSrc(null)
            await uploadBlob(blob)
          }}
        />
      )}
    </div>
  )
}
