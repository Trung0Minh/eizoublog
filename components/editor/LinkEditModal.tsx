"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LinkEditModalProps {
  initialUrl?: string
  onClose: () => void
  onRemove: () => void
  onSubmit: (url: string) => void
}

export function LinkEditModal({
  initialUrl = "",
  onClose,
  onRemove,
  onSubmit,
}: LinkEditModalProps) {
  const [url, setUrl] = useState(initialUrl)

  function handleSubmit() {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      return
    }

    onSubmit(trimmedUrl)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }

    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    }
  }

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      aria-modal="true"
      aria-labelledby="link-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-[8px] border bg-background p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold" id="link-dialog-title">
            Chèn liên kết
          </h2>
          <Button
            aria-label="Close link dialog"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="link-url">
              URL
            </label>
            <Input
              autoFocus
              id="link-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Dán liên kết"
              required
              type="url"
              value={url}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
            <Button onClick={onRemove} type="button" variant="ghost">
              Xóa liên kết
            </Button>
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} type="button" variant="outline">
                Hủy
              </Button>
              <Button onClick={handleSubmit} type="button">
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
