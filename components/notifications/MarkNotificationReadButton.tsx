"use client"

import { Mail, MailOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

interface MarkNotificationReadButtonProps {
  commentId?: string
  eventRoomCommentId?: string
  isRead: boolean
  notificationId?: string
}

export function MarkNotificationReadButton({
  commentId,
  eventRoomCommentId,
  isRead,
  notificationId,
}: MarkNotificationReadButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function toggleRead() {
    const body: Omit<MarkNotificationReadButtonProps, "isRead"> & { read: boolean } = {
      read: !isRead,
    }
    if (commentId) body.commentId = commentId
    if (eventRoomCommentId) body.eventRoomCommentId = eventRoomCommentId
    if (notificationId) body.notificationId = notificationId

    setIsPending(true)

    try {
      const response = await fetch("/api/user/notifications/mark-read", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })

      if (!response.ok) {
        console.error("Failed to update notification read state:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to update notification read state:", error)
    } finally {
      window.dispatchEvent(new Event("notifications:changed"))
      router.refresh()
      setIsPending(false)
    }
  }

  const Icon = isRead ? Mail : MailOpen
  const label = isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"

  return (
    <Button
      aria-label={label}
      className="h-9 gap-1.5 px-3"
      disabled={isPending}
      onClick={() => void toggleRead()}
      size="sm"
      type="button"
      variant="outline"
      title={label}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{isRead ? "Chưa đọc" : "Đã đọc"}</span>
    </Button>
  )
}
