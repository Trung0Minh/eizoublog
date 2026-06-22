"use client"

import { AlertCircle, Check, Loader2 } from "lucide-react"

import type { SaveStatus } from "@/hooks/useAutosave"

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null

  return (
    <div className="flex min-h-5 items-center gap-1.5 text-xs text-text-tertiary">
      {status === "saving" && (
        <>
          <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
          <span>Đang lưu...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check aria-hidden="true" className="h-3 w-3 text-emerald-600" />
          <span className="text-emerald-700 dark:text-emerald-400">Đã lưu</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle aria-hidden="true" className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Lưu thất bại, đang thử lại...</span>
        </>
      )}
    </div>
  )
}
