"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ComponentProps, MouseEvent } from "react"

interface ViewLinkProps extends ComponentProps<typeof Link> {
  commentId?: string
  notificationId?: string
}

export function ViewLink({
  commentId,
  notificationId,
  href,
  onClick,
  ...props
}: ViewLinkProps) {
  const router = useRouter()

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    const body: { commentId?: string; notificationId?: string } = {}
    if (commentId) body.commentId = commentId
    if (notificationId) body.notificationId = notificationId

    if (commentId || notificationId) {
      try {
        await fetch("/api/user/notifications/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
      } catch (error) {
        console.error("Failed to mark notification or comment as read:", error)
      }
    }

    window.dispatchEvent(new Event("notifications:changed"))

    if (onClick) {
      onClick(e)
    }

    const targetHref = typeof href === "string" ? href : (href.href || href.pathname || "")
    router.push(targetHref)
  }

  return <Link href={href} onClick={handleClick} {...props} />
}
