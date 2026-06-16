"use client"

import type { PostStatus } from "@prisma/client"
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
          disabled={actionStatus !== "idle"}
          onClick={() => void updateStatus("DRAFT")}
          size="sm"
          type="button"
          variant="outline"
        >
          {actionStatus === "withdrawing" ? "Đang rút..." : "Rút bài"}
        </Button>
      )}
      <Button
        disabled={actionStatus !== "idle"}
        onClick={() => void updateStatus("ARCHIVED")}
        size="sm"
        type="button"
        variant="destructive"
      >
        {actionStatus === "archiving" ? "Đang lưu trữ..." : "Lưu trữ"}
      </Button>
    </>
  )
}
