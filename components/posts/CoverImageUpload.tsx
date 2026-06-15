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
          <div 
            className="group relative aspect-video w-full overflow-hidden rounded-[8px] border border-border-default bg-subtle-bg cursor-move touch-none"
            onPointerDown={(e) => {
              // Ignore if clicking on buttons
              if ((e.target as HTMLElement).closest('button')) return;
              
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.dataset.isDragging = "true";
              e.currentTarget.dataset.startX = e.clientX.toString();
              e.currentTarget.dataset.startY = e.clientY.toString();
              e.currentTarget.dataset.startPosX = new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50";
              e.currentTarget.dataset.startPosY = new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50";
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
              
              const zoom = parseFloat(new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1");
              
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
              if (e.currentTarget.dataset.isDragging !== "true") return;
              e.currentTarget.dataset.isDragging = "false";
              e.currentTarget.releasePointerCapture(e.pointerId);
              
              const newPosX = parseFloat(e.currentTarget.dataset.posX || "50").toFixed(1);
              const newPosY = parseFloat(e.currentTarget.dataset.posY || "50").toFixed(1);
              
              const [base, query] = (value || "").split("?");
              const params = new URLSearchParams(query || "");
              params.set("posX", newPosX);
              params.set("posY", newPosY);
              onChange(`${base}?${params.toString()}`);
            }}
            onPointerCancel={(e) => {
              e.currentTarget.dataset.isDragging = "false";
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            <img
              alt="Ảnh bìa đã chọn"
              className="h-full w-full object-cover pointer-events-none"
              style={{
                objectPosition: `${new URLSearchParams((value || "").split("?")[1] || "").get("posX") || "50"}% ${new URLSearchParams((value || "").split("?")[1] || "").get("posY") || "50"}%`,
                transform: `scale(${new URLSearchParams((value || "").split("?")[1] || "").get("zoom") || "1"})`,
              }}
              src={value.split("?")[0]}
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 pointer-events-none" />
            <div className="absolute right-2 top-2 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-[10px] text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 pointer-events-none">
              Kéo để di chuyển ảnh
            </div>
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
