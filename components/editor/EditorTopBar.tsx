"use client"

import { ArrowLeft, Settings2, Save } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { Button } from "@/components/ui/button"

type PendingAction = "draft" | "publish" | null

function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent text-current"
      data-button-spinner="true"
    />
  )
}

interface EditorTopBarProps {
  canSave: boolean
  exitHref: string
  isPending: boolean
  isSettingsOpen?: boolean
  isPublished: boolean
  pendingAction?: PendingAction
  onToggleSettings?: () => void
  onPublish: () => void
  onSaveDraft: () => void
  titlePreview?: string
}

export function EditorTopBar({
  canSave,
  exitHref,
  isPending,
  isSettingsOpen = false,
  isPublished,
  pendingAction = null,
  onToggleSettings,
  onPublish,
  onSaveDraft,
  titlePreview,
}: EditorTopBarProps) {
  const actionsDisabled = isPending || !canSave
  const isDraftPending = pendingAction === "draft"
  const isPublishPending = pendingAction === "publish"
  const publishLabel = isPublished ? "Cập nhật" : "Xuất bản"
  const publishPendingLabel = isPublished ? "Đang cập nhật..." : "Đang xuất bản..."

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] group">
      {/* Invisible hover area */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-transparent z-[101]" />
      
      <div className="pt-4 pb-4 pointer-events-none">
        <div className="glass-navbar mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8 rounded-full border border-border-default/60 bg-background/80 backdrop-blur-md shadow-glass pointer-events-auto -translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <Link
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-default/60 bg-background/45 text-text-secondary shadow-sm backdrop-blur-md transition-colors hover:border-accent/35 hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          href={exitHref}
          title="Bảng điều khiển"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>

        <div className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center md:flex">
          <div className="hidden max-w-[280px] truncate text-[13px] font-medium text-text-tertiary md:block">
            {titlePreview?.trim() || "Bài viết không có tiêu đề"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SeasonToggle />
          <ParticleToggle />
          <ThemeToggle />
          {onToggleSettings && (
            <Button
              aria-controls="post-settings-panel"
              aria-expanded={isSettingsOpen}
              aria-label={isSettingsOpen ? "Ẩn cài đặt bài viết" : "Cài đặt bài viết"}
              className="h-9 w-9 rounded-full border-[2px] p-0"
              onClick={onToggleSettings}
              size="icon"
              title="Cài đặt bài viết"
              type="button"
              variant={isSettingsOpen ? "default" : "outline"}
            >
              <Settings2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
          <Button
            className="h-9 w-9 rounded-full border-[2px] p-0"
            disabled={actionsDisabled}
            onClick={onSaveDraft}
            size="icon"
            title="Lưu nháp"
            type="button"
            variant="outline"
          >
            {isDraftPending ? <ButtonSpinner /> : <Save aria-hidden="true" className="h-4 w-4" />}
          </Button>
          <Button
            className="h-9 rounded-full bg-accent hover:bg-accent/90 text-white px-4 font-semibold"
            disabled={actionsDisabled}
            onClick={onPublish}
            size="sm"
            type="button"
          >
            {isPublishPending && <ButtonSpinner />}
            {isPublishPending ? publishPendingLabel : publishLabel}
          </Button>
        </div>
        </div>
      </div>
    </header>
  )
}
