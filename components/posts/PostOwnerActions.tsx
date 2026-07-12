"use client"

import type { PostStatus } from "@prisma/client"
import { Archive, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

type ActionStatus = "idle" | "withdrawing" | "archiving"

interface PostOwnerActionsProps {
  postId: string
  status: PostStatus
}

export function PostOwnerActions({ postId, status }: PostOwnerActionsProps) {
  const router = useRouter()
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle")
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)

  async function updateStatus(
    nextStatus: Extract<PostStatus, "ARCHIVED" | "DRAFT">,
  ) {
    const isArchiving = nextStatus === "ARCHIVED"

    setActionStatus(isArchiving ? "archiving" : "withdrawing")

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })

      if (!response.ok) {
        throw new Error("Failed to update post")
      }

      setArchiveConfirmOpen(false)
      toast.success(isArchiving ? "Đã lưu trữ bài viết" : "Đã rút bài về bản nháp")
      router.refresh()
    } catch (error) {
      setActionStatus("idle")
      toast.error(isArchiving ? "Không thể lưu trữ bài viết" : "Không thể rút bài", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    }
  }

  return (
    <>
      {status === "PUBLISHED" && (
        <Button
          aria-label="Rút bài"
          disabled={actionStatus !== "idle"}
          onClick={() => void updateStatus("DRAFT")}
          size="icon"
          title="Rút bài"
          type="button"
          variant="outline"
          className="hover:bg-subtle-bg text-text-secondary hover:text-text-primary"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}
      <Button
        aria-label="Lưu trữ"
        disabled={actionStatus !== "idle"}
        onClick={() => setArchiveConfirmOpen(true)}
        size="icon"
        title="Lưu trữ"
        type="button"
        variant="outline"
        className="text-text-tertiary hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Archive aria-hidden="true" className="h-4 w-4" />
      </Button>
      <ConfirmationDialog
        cancelLabel="Hủy"
        confirmLabel="Lưu trữ"
        description="Bài viết sẽ không còn hiển thị công khai. Bạn vẫn có thể khôi phục bài viết sau này."
        icon={Archive}
        onConfirm={() => void updateStatus("ARCHIVED")}
        onOpenChange={setArchiveConfirmOpen}
        open={archiveConfirmOpen}
        pending={actionStatus === "archiving"}
        title="Lưu trữ bài viết?"
        tone="warning"
      />
    </>
  )
}
