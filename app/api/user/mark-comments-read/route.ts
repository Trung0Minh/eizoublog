import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  markNotificationsRead,
  markUnreadCommentsRead,
} from "@/lib/notifications"

export async function POST() {
  try {
    const activeSession = await getActiveSession(["ADMIN", "WRITER"])

    if (!activeSession) {
      return unauthorizedResponse()
    }

    const [comments, notifications] = await Promise.all([
      markUnreadCommentsRead(activeSession.user),
      markNotificationsRead(activeSession.user.id),
    ])

    return Response.json({
      data: {
        count: comments.count + notifications.count,
        success: true,
      },
    })
  } catch (error) {
    console.error("[POST /api/user/mark-comments-read]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
