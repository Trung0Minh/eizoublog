import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { markCommentRead, markNotificationRead } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const activeSession = await getActiveSession(["ADMIN", "WRITER"])

    if (!activeSession) {
      return unauthorizedResponse()
    }

    let body: { commentId?: string; notificationId?: string } = {}
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { commentId, notificationId } = body

    if (!commentId && !notificationId) {
      return Response.json(
        { error: "Missing commentId or notificationId" },
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

    const promises: Promise<unknown>[] = []

    if (commentId) {
      promises.push(markCommentRead(commentId, activeSession.user))
    }

    if (notificationId) {
      promises.push(markNotificationRead(notificationId, activeSession.user.id))
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
