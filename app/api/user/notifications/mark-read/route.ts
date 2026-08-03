import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  markCommentRead,
  markCommentUnread,
  markEventRoomCommentRead,
  markEventRoomCommentUnread,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const activeSession = await getActiveSession(["ADMIN", "WRITER"])

    if (!activeSession) {
      return unauthorizedResponse()
    }

    let body: {
      commentId?: string
      eventRoomCommentId?: string
      notificationId?: string
      read?: boolean
    } = {}
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { commentId, eventRoomCommentId, notificationId, read = true } = body

    if (!commentId && !eventRoomCommentId && !notificationId) {
      return Response.json(
        { error: "Missing commentId, eventRoomCommentId, or notificationId" },
        { status: 400 },
      )
    }

    if (commentId && typeof commentId !== "string") {
      return Response.json(
        { error: "Invalid commentId format" },
        { status: 400 },
      )
    }

    if (notificationId && typeof notificationId !== "string") {
      return Response.json(
        { error: "Invalid notificationId format" },
        { status: 400 },
      )
    }

    if (eventRoomCommentId && typeof eventRoomCommentId !== "string") {
      return Response.json(
        { error: "Invalid eventRoomCommentId format" },
        { status: 400 },
      )
    }

    if (typeof read !== "boolean") {
      return Response.json(
        { error: "Invalid read format" },
        { status: 400 },
      )
    }

    const promises: Promise<unknown>[] = []

    if (commentId) {
      promises.push(
        read
          ? markCommentRead(commentId, activeSession.user)
          : markCommentUnread(commentId, activeSession.user),
      )
    }

    if (eventRoomCommentId) {
      promises.push(
        read
          ? markEventRoomCommentRead(eventRoomCommentId, activeSession.user.id)
          : markEventRoomCommentUnread(eventRoomCommentId, activeSession.user.id),
      )
    }

    if (notificationId) {
      promises.push(
        read
          ? markNotificationRead(notificationId, activeSession.user.id)
          : markNotificationUnread(notificationId, activeSession.user.id),
      )
    }

    if (promises.length > 0) {
      await Promise.all(promises)
    }

    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error("[POST /api/user/notifications/mark-read]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
