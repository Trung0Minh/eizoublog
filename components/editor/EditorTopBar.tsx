"use client"

import {
  ArrowLeft,
  Eye,
  RefreshCw,
  Save,
  Send,
  Settings2,
} from "lucide-react"
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
  previewHref?: string | null
  onToggleSettings?: () => void
  onPublish: () => void
  onSaveDraft: () => void
}

const railButtonClass =
  "h-9 w-9 rounded-full border border-border-default/60 bg-background/45 p-0 text-text-secondary shadow-sm backdrop-blur-md hover:border-accent/35 hover:bg-subtle-bg hover:text-text-primary"

export function EditorTopBar({
  canSave,
  exitHref,
  isPending,
  isSettingsOpen = false,
  isPublished,
  pendingAction = null,
  previewHref,
  onToggleSettings,
  onPublish,
  onSaveDraft,
}: EditorTopBarProps) {
  const actionsDisabled = isPending || !canSave
  const isDraftPending = pendingAction === "draft"
  const isPublishPending = pendingAction === "publish"
  const publishLabel = isPublished ? "Cập nhật bài viết" : "Xuất bản bài viết"

  return (
    <aside
      aria-label="Thao tác bài viết"
      className="fixed left-4 top-1/2 z-[100] flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border-default/60 bg-background/80 p-2 shadow-glass backdrop-blur-xl"
      data-testid="editor-action-rail"
    >
      <Link
        aria-label="Bảng điều khiển"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-default/60 bg-background/45 text-text-secondary shadow-sm transition-colors hover:border-accent/35 hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={exitHref}
        title="Bảng điều khiển"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Link>

      <div className="h-px w-5 bg-border-default" />

      {previewHref ? (
        <Link
          aria-label="Xem trước bài viết"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={previewHref}
          title="Xem trước bài viết"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : (
        <Button
          aria-label="Xem trước bài viết"
          className={railButtonClass}
          disabled
          size="icon"
          title="Lưu nháp trước để xem trước"
          type="button"
          variant="ghost"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}
      <SeasonToggle />
      <ParticleToggle />
      <ThemeToggle />
      {onToggleSettings && (
        <Button
          aria-controls="post-settings-panel"
          aria-expanded={isSettingsOpen}
          aria-label={isSettingsOpen ? "Ẩn cài đặt bài viết" : "Cài đặt bài viết"}
          className={railButtonClass}
          onClick={onToggleSettings}
          size="icon"
          title="Cài đặt bài viết"
          type="button"
          variant={isSettingsOpen ? "default" : "ghost"}
        >
          <Settings2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      <div className="h-px w-5 bg-border-default" />

      <Button
        aria-label="Lưu nháp"
        className={railButtonClass}
        disabled={actionsDisabled}
        onClick={onSaveDraft}
        size="icon"
        title="Lưu nháp"
        type="button"
        variant="ghost"
      >
        {isDraftPending ? <ButtonSpinner /> : <Save aria-hidden="true" className="h-4 w-4" />}
      </Button>
      <Button
        aria-label={publishLabel}
        className="h-9 w-9 rounded-full bg-accent p-0 text-white shadow-sm hover:bg-accent/90"
        disabled={actionsDisabled}
        onClick={onPublish}
        size="icon"
        title={publishLabel}
        type="button"
      >
        {isPublishPending ? (
          <ButtonSpinner />
        ) : isPublished ? (
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Send aria-hidden="true" className="h-4 w-4" />
        )}
      </Button>
    </aside>
  )
}
