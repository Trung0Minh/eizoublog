import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getNotificationCounts, getNotifications } from "@/lib/notifications"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const [notifications, counts] = await Promise.all([
      getNotifications(activeSession.user),
      getNotificationCounts(activeSession.user),
    ])

    return Response.json({ data: { ...notifications, counts } })
  } catch (error) {
    console.error("[GET /api/user/notifications]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
