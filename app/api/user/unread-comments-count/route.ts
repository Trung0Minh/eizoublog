import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getNotificationCounts } from "@/lib/notifications"

export async function GET() {
  try {
    const activeSession = await getActiveSession(["ADMIN", "WRITER"])

    if (!activeSession) {
      return unauthorizedResponse()
    }

    const counts = await getNotificationCounts(activeSession.user)

    return Response.json({ data: { count: counts.unreadComments } })
  } catch (error) {
    console.error("[GET /api/user/unread-comments-count]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
