"use client"

import { ArrowLeft, Settings2 } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/Loader"
import type { SaveStatus } from "@/hooks/useAutosave"

type PendingAction = "draft" | "publish" | null

interface EditorTopBarProps {
  autosaveHint?: string
  canSave: boolean
  exitHref: string
  isPending: boolean
  isSettingsOpen?: boolean
  isPublished: boolean
  pendingAction?: PendingAction
  onToggleSettings?: () => void
  onPublish: () => void
  onSaveDraft: () => void
  saveStatus: SaveStatus
  titlePreview?: string
}

export function EditorTopBar({
  autosaveHint = "Tự động lưu sau khi chỉnh sửa tiêu đề, đoạn trích hoặc nội dung.",
  canSave,
  exitHref,
  isPending,
  isSettingsOpen = false,
  isPublished,
  pendingAction = null,
  onToggleSettings,
  onPublish,
  onSaveDraft,
  saveStatus,
  titlePreview,
}: EditorTopBarProps) {
  const actionsDisabled = isPending || !canSave
  const isDraftPending = pendingAction === "draft"
  const isPublishPending = pendingAction === "publish"
  const publishLabel = isPublished ? "Cập nhật" : "Xuất bản"
  const publishPendingLabel = isPublished ? "Đang cập nhật..." : "Đang xuất bản..."
  const statusText = canSave
    ? autosaveHint
    : "Thêm tiêu đề để có thể lưu và xuất bản."

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] h-12 border-b border-border-default bg-background px-5">
      <div className="flex h-full items-center justify-between gap-3">
        <Link
          className="group flex items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
          href={exitHref}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span className="hidden text-[13px] font-medium md:inline">
            Bảng điều khiển
          </span>
        </Link>

        <div className="absolute left-1/2 flex h-full -translate-x-1/2 items-center">
          <div className="flex min-w-[70px] justify-end">
            {isPending ? (
              <span className="text-xs text-text-tertiary">Đang lưu...</span>
            ) : saveStatus === "idle" ? (
              <span className="block text-xs text-text-tertiary">
                {statusText}
              </span>
            ) : (
              <SaveStatusIndicator status={saveStatus} />
            )}
          </div>
          <div className="mx-3 hidden h-4 w-px bg-border-default md:block" />
          <div className="hidden max-w-[280px] truncate text-[13px] text-text-tertiary md:block">
            {titlePreview?.trim() || "Bài viết không có tiêu đề"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {onToggleSettings && (
            <Button
              aria-controls="post-settings-panel"
              aria-expanded={isSettingsOpen}
              aria-label={isSettingsOpen ? "Ẩn cài đặt bài viết" : "Cài đặt bài viết"}
              className="h-8 px-2 md:px-3 lg:hidden"
              onClick={onToggleSettings}
              size="sm"
              type="button"
              variant={isSettingsOpen ? "default" : "outline"}
            >
              <Settings2 aria-hidden="true" className="h-4 w-4" />
              <span className="hidden md:inline">
                {isSettingsOpen ? "Ẩn cài đặt" : "Cài đặt bài viết"}
              </span>
            </Button>
          )}
          <Button
            className="h-8 px-2 md:px-3.5"
            disabled={actionsDisabled}
            onClick={onSaveDraft}
            size="sm"
            type="button"
            variant="outline"
          >
            {isDraftPending && <Loader aria-hidden="true" size="sm" />}
            <span className="hidden md:inline">
              {isDraftPending ? "Đang lưu..." : "Lưu nháp"}
            </span>
            <span className="md:hidden">{isDraftPending ? "..." : "Nháp"}</span>
          </Button>
          <Button
            className="h-8 px-3.5 font-semibold"
            disabled={actionsDisabled}
            onClick={onPublish}
            size="sm"
            type="button"
          >
            {isPublishPending && <Loader aria-hidden="true" size="sm" />}
            {isPublishPending ? publishPendingLabel : publishLabel}
          </Button>
        </div>
      </div>
    </header>
  )
}
