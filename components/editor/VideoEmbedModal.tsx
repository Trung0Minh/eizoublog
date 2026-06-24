"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VideoEmbedModalProps {
  onClose: () => void
  onInsert: (url: string, caption: string) => void
}

export function VideoEmbedModal({ onClose, onInsert }: VideoEmbedModalProps) {
  const [url, setUrl] = useState("")

  function handleSubmit() {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      return
    }

    onInsert(trimmedUrl, "")
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }
  }

  return createPortal(
    <div
      aria-modal="true"
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
          <h2 className="text-lg font-semibold">Chèn video</h2>
          <Button
            aria-label="Close video embed dialog"
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
            <label className="text-sm font-medium" htmlFor="video-url">
              Đường dẫn video
            </label>
            <p className="text-xs text-muted-foreground">
              Hỗ trợ YouTube, Discord, và liên kết .mp4/.webm trực tiếp
            </p>
            <Input
              autoFocus
              id="video-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              required
              type="url"
              value={url}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onClose} type="button" variant="outline">
              Hủy
            </Button>
            <Button onClick={handleSubmit} type="button">Chèn</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
