"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, Crop, Loader2, Trash2, Upload, X } from "lucide-react"
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

async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
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
  useEffect(() => {
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
        className="relative h-[340px] w-[340px] overflow-hidden rounded-[16px] bg-black/50 shadow-2xl"
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
  const cropSourceRef = useRef<string | null>(null)
  const originalSourceRef = useRef<string | null>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  // localSrc: object URL from the file picker, used in the cropper modal
  const [localSrc, setLocalSrc] = useState<string | null>(null)

  function setCropSource(source: string | null) {
    cropSourceRef.current = source
    setLocalSrc(source)
  }

  function rememberOriginalSource(source: string) {
    if (!source.startsWith("blob:")) return

    const previousSource = originalSourceRef.current
    if (previousSource && previousSource !== source) {
      URL.revokeObjectURL(previousSource)
    }
    originalSourceRef.current = source
  }

  function clearOriginalSource() {
    const source = originalSourceRef.current
    if (source) {
      URL.revokeObjectURL(source)
      originalSourceRef.current = null
    }
  }

  // Keep the selected original alive for later crop adjustments, then clean it
  // up only when it is replaced, removed, or the component unmounts.
  useEffect(() => {
    return () => {
      const cropSource = cropSourceRef.current
      const originalSource = originalSourceRef.current
      if (cropSource?.startsWith("blob:") && cropSource !== originalSource) {
        URL.revokeObjectURL(cropSource)
      }
      if (originalSource) {
        URL.revokeObjectURL(originalSource)
      }
    }
  }, [])

  function openCropper(file: File) {
    const url = URL.createObjectURL(file)
    const pendingSource = cropSourceRef.current
    if (
      pendingSource?.startsWith("blob:") &&
      pendingSource !== originalSourceRef.current
    ) {
      URL.revokeObjectURL(pendingSource)
    }
    setCropSource(url)
  }

  async function uploadBlob(blob: Blob, cropSource: string) {
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
      rememberOriginalSource(cropSource)
    } catch (uploadError) {
      if (
        cropSource.startsWith("blob:") &&
        cropSource !== originalSourceRef.current
      ) {
        URL.revokeObjectURL(cropSource)
      }
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
          aria-label={value ? "Căn chỉnh ảnh đại diện" : "Thay đổi ảnh đại diện"}
          className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={uploading}
          onClick={() => {
            if (value) {
              setCropSource(originalSourceRef.current ?? value)
            } else {
              inputRef.current?.click()
            }
          }}
          type="button"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          ) : value ? (
            <Crop aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Camera aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            aria-label={uploading ? "Đang tải ảnh đại diện lên" : "Tải ảnh đại diện mới"}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            size="icon"
            title={uploading ? "Đang tải ảnh đại diện lên" : "Tải ảnh đại diện mới"}
            type="button"
            variant="outline"
          >
            {uploading ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="h-4 w-4" />
            )}
          </Button>
          {value && (
            <Button
              aria-label="Xóa ảnh đại diện"
              onClick={() => {
                clearOriginalSource()
                setCropSource(null)
                onChange("")
              }}
              size="icon"
              title="Xóa ảnh đại diện"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
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
            if (
              localSrc.startsWith("blob:") &&
              localSrc !== originalSourceRef.current
            ) {
              URL.revokeObjectURL(localSrc)
            }
            setCropSource(null)
          }}
          onConfirm={async (blob) => {
            const cropSource = localSrc
            setCropSource(null)
            await uploadBlob(blob, cropSource)
          }}
        />
      )}
    </div>
  )
}
