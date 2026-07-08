"use client"

import type { PostStatus } from "@prisma/client"
import { Archive, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type ActionStatus = "idle" | "withdrawing" | "archiving"

interface PostOwnerActionsProps {
  postId: string
  status: PostStatus
}

export function PostOwnerActions({ postId, status }: PostOwnerActionsProps) {
  const router = useRouter()
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle")

  async function updateStatus(
    nextStatus: Extract<PostStatus, "ARCHIVED" | "DRAFT">,
  ) {
    const isArchiving = nextStatus === "ARCHIVED"

    if (
      isArchiving &&
      !window.confirm(
        "Lưu trữ bài viết này? Bài viết sẽ không còn hiển thị công khai.",
      )
    ) {
      return
    }

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

      router.refresh()
    } catch {
      setActionStatus("idle")
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
        onClick={() => void updateStatus("ARCHIVED")}
        size="icon"
        title="Lưu trữ"
        type="button"
        variant="outline"
        className="text-text-tertiary hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Archive aria-hidden="true" className="h-4 w-4" />
      </Button>
    </>
  )
}
