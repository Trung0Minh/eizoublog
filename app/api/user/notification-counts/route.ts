import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getNotificationCounts } from "@/lib/notifications"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const counts = await getNotificationCounts(activeSession.user)

    return Response.json({ data: { counts } })
  } catch (error) {
    console.error("[GET /api/user/notification-counts]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
