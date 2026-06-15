"use client"

import { useRef, useState } from "react"
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
            <img
              alt="Ảnh bìa đã chọn"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50"}% ${new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50"}%`,
                transform: `scale(${new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"})`,
              }}
              src={value.split("?")[0]}
            />
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

function CoverCropperModal({
  value,
  onClose,
  onConfirm,
}: {
  value: string
  onClose: () => void
  onConfirm: (url: string) => void
}) {
  const [zoom, setZoom] = useState(parseFloat(new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"));
  const initialPosX = parseFloat(new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50");
  const initialPosY = parseFloat(new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4">
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

      <div 
        className="relative w-full max-w-3xl aspect-video overflow-hidden rounded-lg bg-black/50 cursor-move touch-none shadow-2xl ring-1 ring-white/20"
        onWheel={(e) => {
          e.stopPropagation()
          if (e.deltaY < 0) {
            setZoom((s) => Math.min(s + 0.1, 3))
          } else {
            setZoom((s) => Math.max(s - 0.1, 1))
          }
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.dataset.isDragging = "true";
          e.currentTarget.dataset.startX = e.clientX.toString();
          e.currentTarget.dataset.startY = e.clientY.toString();
          if (!e.currentTarget.dataset.posX) e.currentTarget.dataset.posX = initialPosX.toString();
          if (!e.currentTarget.dataset.posY) e.currentTarget.dataset.posY = initialPosY.toString();
          e.currentTarget.dataset.startPosX = e.currentTarget.dataset.posX;
          e.currentTarget.dataset.startPosY = e.currentTarget.dataset.posY;
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.dataset.isDragging !== "true") return;
          const startX = parseFloat(e.currentTarget.dataset.startX || "0");
          const startY = parseFloat(e.currentTarget.dataset.startY || "0");
          const startPosX = parseFloat(e.currentTarget.dataset.startPosX || "50");
          const startPosY = parseFloat(e.currentTarget.dataset.startPosY || "50");
          
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          const rect = e.currentTarget.getBoundingClientRect();
          
          let newPosX = startPosX - (dx / rect.width) * 100 / zoom;
          let newPosY = startPosY - (dy / rect.height) * 100 / zoom;
          
          newPosX = Math.max(0, Math.min(100, newPosX));
          newPosY = Math.max(0, Math.min(100, newPosY));
          
          e.currentTarget.dataset.posX = newPosX.toString();
          e.currentTarget.dataset.posY = newPosY.toString();
          
          const img = e.currentTarget.querySelector('img');
          if (img) {
            img.style.objectPosition = `${newPosX}% ${newPosY}%`;
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.dataset.isDragging = "false";
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          e.currentTarget.dataset.isDragging = "false";
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <img
          alt="Ảnh bìa"
          className="h-full w-full object-cover pointer-events-none"
          style={{
            objectPosition: `${initialPosX}% ${initialPosY}%`,
            transform: `scale(${zoom})`,
          }}
          src={value.split("?")[0]}
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
          onClick={(e) => {
            const container = e.currentTarget.parentElement?.previousElementSibling as HTMLElement;
            const finalX = parseFloat(container?.dataset.posX || initialPosX.toString()).toFixed(1);
            const finalY = parseFloat(container?.dataset.posY || initialPosY.toString()).toFixed(1);
            
            const [base, query] = (value || "").split("?");
            const params = new URLSearchParams(query || "");
            params.set("posX", finalX);
            params.set("posY", finalY);
            params.set("zoom", zoom.toFixed(2));
            onConfirm(`${base}?${params.toString()}`);
          }}
        >
          Xác nhận
        </button>
      </div>
    </div>
  )
}
