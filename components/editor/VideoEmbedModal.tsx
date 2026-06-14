"use client"

import { X } from "lucide-react"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VideoEmbedModalProps {
  onClose: () => void
  onInsert: (url: string, caption: string) => void
}

export function VideoEmbedModal({ onClose, onInsert }: VideoEmbedModalProps) {
  const [caption, setCaption] = useState("")
  const [url, setUrl] = useState("")

  function handleSubmit() {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      return
    }

    onInsert(trimmedUrl, caption.trim())
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-[8px] border bg-background p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Embed video</h2>
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
              Video URL
            </label>
            <p className="text-xs text-muted-foreground">
              Supports YouTube links such as https://youtube.com/watch?v=...
            </p>
            <Input
              autoFocus
              id="video-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              type="url"
              value={url}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="video-caption">
              Caption{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="video-caption"
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Brief description of the video..."
              type="text"
              value={caption}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmit} type="button">Insert</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
