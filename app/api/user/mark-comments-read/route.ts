import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { markUnreadCommentsRead } from "@/lib/notifications"

export async function POST() {
  try {
    const activeSession = await getActiveSession(["ADMIN", "WRITER"])

    if (!activeSession) {
      return unauthorizedResponse()
    }

    const result = await markUnreadCommentsRead(activeSession.user)

    return Response.json({ data: { count: result.count, success: true } })
  } catch (error) {
    console.error("[POST /api/user/mark-comments-read]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
