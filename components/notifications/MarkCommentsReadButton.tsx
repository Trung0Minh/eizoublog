"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { announceNotificationsChanged } from "@/lib/clientNotifications"

export function MarkCommentsReadButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function markRead() {
    setPending(true)
    try {
      const response = await fetch("/api/user/mark-comments-read", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark comments read")
      }

      announceNotificationsChanged()
      router.refresh()
    } catch {
      setPending(false)
    }
  }

  return (
    <Button
      disabled={disabled || pending}
      onClick={markRead}
      size="sm"
      type="button"
      variant="outline"
    >
      {pending ? "Đang đánh dấu..." : "Đánh dấu tất cả đã đọc"}
    </Button>
  )
}
