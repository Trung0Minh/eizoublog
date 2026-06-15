"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CoAuthorInviteActions({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleAccept() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}/co-authors/accept`, { method: "POST" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("Failed to accept invitation")
      setIsPending(false)
    }
  }

  async function handleDecline() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}/co-authors/decline`, { method: "POST" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("Failed to decline invitation")
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
