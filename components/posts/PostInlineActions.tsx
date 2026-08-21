"use client"

import type { PostStatus } from "@prisma/client"
import {
  Archive,
  Loader2,
  Pencil,
  RotateCcw,
  Settings,
  ShieldX,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { useSessionUser } from "@/lib/clientSession"
import { cn } from "@/lib/utils"

type PendingAction = "feature" | "draft" | "archive" | "remove" | null

interface PostInlineActionsProps {
  authorUsernames: string[]
  editHrefByUsername?: Record<string, string>
  eventSettingsHref?: string
  featuredAt?: Date | string | null
  postId: string
  splitAdminActionsOnMobile?: boolean
  status?: PostStatus
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

  return "Vui lòng thử lại."
}

export function PostInlineActions({
  authorUsernames,
  editHrefByUsername,
  eventSettingsHref,
  featuredAt,
  postId,
  splitAdminActionsOnMobile = false,
  status,
}: PostInlineActionsProps) {
  const router = useRouter()
  const { user } = useSessionUser()
  const [isFeatured, setIsFeatured] = useState(Boolean(featuredAt))
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const editHref =
    user?.username && editHrefByUsername
      ? editHrefByUsername[user.username]
      : user?.username && authorUsernames.includes(user.username)
        ? `/dashboard/edit/${postId}`
        : null
  const canEdit = Boolean(editHref)
  const isAdmin = user?.role === "ADMIN"
  const isPublished = status !== "ARCHIVED" && status !== "REMOVED"

  if (!canEdit && !isAdmin) {
    return null
  }

  async function toggleFeatured() {
    const nextFeatured = !isFeatured
    setPendingAction("feature")

    try {
      const response = await fetch(`/api/admin/posts/${postId}/featured`, {
        body: JSON.stringify({ featured: nextFeatured }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setIsFeatured(nextFeatured)
      toast.success(
        nextFeatured
          ? "Đã đưa vào bài viết nổi bật"
          : "Đã bỏ khỏi bài viết nổi bật",
      )
      router.refresh()
    } catch (error) {
      toast.error("Không thể cập nhật bài nổi bật", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function updateStatus(nextStatus: Extract<PostStatus, "ARCHIVED" | "DRAFT">) {
    setPendingAction(nextStatus === "ARCHIVED" ? "archive" : "draft")

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      toast.success(
        nextStatus === "ARCHIVED"
          ? "Đã lưu trữ bài viết"
          : "Đã rút bài về bản nháp",
      )
      router.refresh()
    } catch (error) {
      toast.error(
        nextStatus === "ARCHIVED" ? "Không thể lưu trữ bài viết" : "Không thể rút bài",
        {
          description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        },
      )
    } finally {
      setPendingAction(null)
    }
  }

  async function removePost() {
    setPendingAction("remove")

    try {
      const response = await fetch(`/api/admin/posts/${postId}/moderation`, {
        body: JSON.stringify({
          action: "REMOVE",
          reason: "Admin removed directly from public post page.",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setRemoveConfirmOpen(false)
      toast.success("Đã gỡ bài viết")
      router.refresh()
    } catch (error) {
      toast.error("Không thể gỡ bài viết", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  const iconClass = "h-4 w-4"
  const buttonClass =
    "h-8 w-8 rounded-[8px] p-0 text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
  const editButtonClass =
    "h-8 rounded-[10px] border border-border-default/70 bg-background/85 px-2.5 text-text-secondary shadow-sm backdrop-blur-xl transition-colors hover:bg-subtle-bg hover:text-text-primary"
  const showAdminActions =
    isAdmin && (Boolean(eventSettingsHref) || isPublished || status !== "REMOVED")

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          splitAdminActionsOnMobile &&
            "contents sm:flex sm:flex-wrap sm:items-center sm:gap-2",
        )}
        data-testid="post-inline-actions"
      >
        {canEdit && (
          <Button
            asChild
            aria-label="Chỉnh sửa bài viết"
            className={editButtonClass}
            title="Chỉnh sửa"
            variant="ghost"
          >
            <Link href={editHref ?? `/dashboard/edit/${postId}`} prefetch={false}>
              <Pencil aria-hidden="true" className={iconClass} />
              <span className="text-[12px] font-bold">Chỉnh sửa</span>
            </Link>
          </Button>
        )}

        {showAdminActions && (
          <div
            className="contents"
            data-testid="post-admin-actions"
          >
            <div className="inline-flex items-center gap-1 rounded-[12px] border border-border-default/70 bg-background/85 p-1.5 shadow-sm backdrop-blur-xl">
              {isAdmin && eventSettingsHref && (
                <Button
                  asChild
                  aria-label="Cài đặt sự kiện"
                  className={buttonClass}
                  size="icon"
                  title="Cài đặt"
                  variant="ghost"
                >
                  <Link href={eventSettingsHref} prefetch={false}>
                    <Settings aria-hidden="true" className={iconClass} />
                  </Link>
                </Button>
              )}

              {isAdmin && isPublished && (
                <Button
                  aria-label={isFeatured ? "Bỏ khỏi bài nổi bật" : "Đưa vào bài nổi bật"}
                  className={cn(
                    buttonClass,
                    isFeatured &&
                      "bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
                  )}
                  disabled={pendingAction !== null}
                  onClick={() => void toggleFeatured()}
                  size="icon"
                  title={isFeatured ? "Bỏ khỏi bài nổi bật" : "Đưa vào bài nổi bật"}
                  type="button"
                  variant="ghost"
                >
                  {pendingAction === "feature" ? (
                    <Loader2 aria-hidden="true" className={`${iconClass} animate-spin`} />
                  ) : (
                    <Star
                      aria-hidden="true"
                      className={cn(iconClass, isFeatured && "fill-current")}
                    />
                  )}
                </Button>
              )}

              {isAdmin && isPublished && (
                <Button
                  aria-label="Rút bài"
                  className={buttonClass}
                  disabled={pendingAction !== null}
                  onClick={() => void updateStatus("DRAFT")}
                  size="icon"
                  title="Rút bài"
                  type="button"
                  variant="ghost"
                >
                  {pendingAction === "draft" ? (
                    <Loader2 aria-hidden="true" className={`${iconClass} animate-spin`} />
                  ) : (
                    <RotateCcw aria-hidden="true" className={iconClass} />
                  )}
                </Button>
              )}

              {isAdmin && status !== "ARCHIVED" && status !== "REMOVED" && (
                <Button
                  aria-label="Lưu trữ"
                  className="h-8 w-8 rounded-[8px] p-0 text-text-secondary transition-colors hover:bg-orange-500/10 hover:text-orange-500"
                  disabled={pendingAction !== null}
                  onClick={() => void updateStatus("ARCHIVED")}
                  size="icon"
                  title="Lưu trữ"
                  type="button"
                  variant="ghost"
                >
                  {pendingAction === "archive" ? (
                    <Loader2 aria-hidden="true" className={`${iconClass} animate-spin`} />
                  ) : (
                    <Archive aria-hidden="true" className={iconClass} />
                  )}
                </Button>
              )}

              {isAdmin && status !== "REMOVED" && (
                <Button
                  aria-label="Gỡ bài viết"
                  className="h-8 w-8 rounded-[8px] p-0 text-text-tertiary transition-colors hover:bg-destructive/10 hover:text-destructive"
                  disabled={pendingAction !== null}
                  onClick={() => setRemoveConfirmOpen(true)}
                  size="icon"
                  title="Gỡ bài viết"
                  type="button"
                  variant="ghost"
                >
                  <ShieldX aria-hidden="true" className={iconClass} />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        cancelLabel="Giữ bài"
        confirmLabel="Gỡ bài"
        description="Bài viết sẽ bị ẩn khỏi trang công khai và chuyển vào khu vực kiểm duyệt."
        icon={ShieldX}
        onConfirm={() => void removePost()}
        onOpenChange={setRemoveConfirmOpen}
        open={removeConfirmOpen}
        pending={pendingAction === "remove"}
        title="Gỡ bài viết?"
        tone="destructive"
      />
    </>
  )
}
