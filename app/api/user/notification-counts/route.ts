import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getUnseenOpenEventCount } from "@/lib/eventNotifications"
import { getNotificationCounts } from "@/lib/notifications"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const [notificationCounts, openEvents] = await Promise.all([
      getNotificationCounts(activeSession.user),
      getUnseenOpenEventCount(activeSession.user.id),
    ])
    const counts = {
      ...notificationCounts,
      openEvents,
      total: notificationCounts.total + openEvents,
    }

    return Response.json(
      { data: { counts } },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[GET /api/user/notification-counts]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
