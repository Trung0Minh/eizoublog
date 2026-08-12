"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ComponentProps, MouseEvent } from "react"

import { announceNotificationsChanged } from "@/lib/clientNotifications"

interface ViewLinkProps extends ComponentProps<typeof Link> {
  commentId?: string
  eventRoomCommentId?: string
  notificationId?: string
}

export function ViewLink({
  commentId,
  eventRoomCommentId,
  notificationId,
  href,
  onClick,
  ...props
}: ViewLinkProps) {
  const router = useRouter()

  const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) => {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  }

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e)
    }

    const body: {
      commentId?: string
      eventRoomCommentId?: string
      notificationId?: string
    } = {}
    if (commentId) body.commentId = commentId
    if (eventRoomCommentId) body.eventRoomCommentId = eventRoomCommentId
    if (notificationId) body.notificationId = notificationId

    const hasTarget = props.target && props.target !== "_self"

    if (
      e.defaultPrevented ||
      e.button !== 0 || // not left click
      isModifiedEvent(e) ||
      hasTarget
    ) {
      // Let browser handle native new tab/window behavior
      if (commentId || eventRoomCommentId || notificationId) {
        fetch("/api/user/notifications/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          keepalive: true,
        })
          .then((response) => {
            if (response.ok) announceNotificationsChanged()
          })
          .catch((err) => {
            console.error("Failed to mark as read in background:", err)
          })
      }
      return
    }

    // Normal client-side SPA navigation - non-blocking
    e.preventDefault()

    if (commentId || eventRoomCommentId || notificationId) {
      fetch("/api/user/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok) {
            console.error("Failed to mark notification/comment as read:", res.statusText)
            return
          }
          announceNotificationsChanged()
        })
        .catch((error) => {
          console.error("Failed to mark notification or comment as read:", error)
        })
    }

    let targetHref = ""
    if (typeof href === "string") {
      targetHref = href
    } else {
      const queryStr = href.query
        ? `?${new URLSearchParams(href.query as Record<string, string>).toString()}`
        : ""
      const hashStr = href.hash ? `#${href.hash.replace(/^#/, "")}` : ""
      targetHref = `${href.pathname || ""}${queryStr}${hashStr}`
    }
    router.push(targetHref)
  }

  return <Link href={href} onClick={handleClick} {...props} />
}
