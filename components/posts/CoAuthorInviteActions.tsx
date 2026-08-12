"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { announceNotificationsChanged } from "@/lib/clientNotifications"

export function CoAuthorInviteActions({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleAccept() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}/co-authors/accept`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Invitation accepted")
      announceNotificationsChanged()
      router.refresh()
    } catch {
      toast.error("Failed to accept invitation", {
        description: "Your invitation is unchanged. Please try again.",
      })
      setIsPending(false)
    }
  }

  async function handleDecline() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}/co-authors/decline`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Invitation declined")
      announceNotificationsChanged()
      router.refresh()
    } catch {
      toast.error("Failed to decline invitation", {
        description: "Your invitation is unchanged. Please try again.",
      })
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
        disabled={isPending}
        onClick={handleAccept}
      >
        <Check className="h-3.5 w-3.5" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-8 gap-1.5"
        disabled={isPending}
        onClick={handleDecline}
      >
        <X className="h-3.5 w-3.5" />
        Decline
      </Button>
    </div>
  )
}
