"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, Crop, ImagePlus, Loader2, X } from "lucide-react"

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
  const [isCropping, setIsCropping] = useState(false)

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
            <div className="relative overflow-hidden w-full h-full">
              <img
                alt="Ảnh bìa đã chọn"
                className="h-full w-full"
                style={getCoverStyle(value)}
                src={value.split("?")[0]}
              />
            </div>
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 pointer-events-none" />
            
            <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <button
                aria-label="Cắt ảnh bìa"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
                onClick={(e) => { e.stopPropagation(); setIsCropping(true); }}
                type="button"
              >
                <Crop aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                aria-label="Thay đổi ảnh bìa"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                type="button"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                aria-label="Xóa ảnh bìa"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            
            <button
              className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
              onClick={() => setIsCropping(true)}
              type="button"
              aria-label="Mở công cụ cắt ảnh"
            />
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-[10px] text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 pointer-events-none">
              Nhấn để căn chỉnh ảnh
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

      {isCropping && (
        <CoverCropperModal
          value={value}
          onClose={() => setIsCropping(false)}
          onConfirm={(url) => {
            onChange(url)
            setIsCropping(false)
          }}
        />
      )}
    </div>
  )
}

import { createPortal } from "react-dom"
import Cropper from "react-easy-crop"
import { getCoverStyle } from "@/lib/cover-style"

function CoverCropperModal({
  value,
  onClose,
  onConfirm,
}: {
  value: string
  onClose: () => void
  onConfirm: (url: string) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(parseFloat(new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"))
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const [initialCroppedAreaPercentages] = useState(() => {
    const params = new URLSearchParams((value || "").split("?")[1] || "");
    if (params.has("cw")) {
      return {
        x: parseFloat(params.get("cx") || "0"),
        y: parseFloat(params.get("cy") || "0"),
        width: parseFloat(params.get("cw") || "100"),
        height: parseFloat(params.get("ch") || "100"),
      };
    }
    return undefined;
  });

  if (!mounted) return null;

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
        <h3 className="text-lg font-medium text-white mb-1">Căn chỉnh ảnh bìa</h3>
        <p className="text-sm">Kéo để di chuyển, cuộn chuột để thu phóng</p>
      </div>

      <div className="relative w-full max-w-3xl aspect-video overflow-hidden rounded-lg bg-black/50 shadow-2xl ring-1 ring-white/20">
        <Cropper
          image={value.split("?")[0]}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          initialCroppedAreaPercentages={initialCroppedAreaPercentages}
          onCropChange={setCrop}
          onCropComplete={(_, croppedAreaPercentages) => {
            setCroppedAreaPercentages(croppedAreaPercentages)
          }}
          onZoomChange={setZoom}
          showGrid={false}
          style={{
            containerStyle: { background: "transparent" },
          }}
        />
        
        <div className="absolute inset-0 pointer-events-none border border-white/20" />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          className="rounded-md bg-white/10 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          onClick={onClose}
        >
          Hủy
        </button>
        <button
          className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
          onClick={() => {
            if (!croppedAreaPercentages) {
              onClose();
              return;
            }
            
            const [base, query] = (value || "").split("?");
            const params = new URLSearchParams(query || "");
            
            params.set("cx", croppedAreaPercentages.x.toFixed(2));
            params.set("cy", croppedAreaPercentages.y.toFixed(2));
            params.set("cw", croppedAreaPercentages.width.toFixed(2));
            params.set("ch", croppedAreaPercentages.height.toFixed(2));
            params.set("zoom", zoom.toFixed(2));
            
            // Remove legacy params
            params.delete("tx");
            params.delete("ty");
            params.delete("posX");
            params.delete("posY");
            
            onConfirm(`${base}?${params.toString()}`);
          }}
        >
          Xác nhận
        </button>
      </div>
    </div>,
    document.body
  )
}
