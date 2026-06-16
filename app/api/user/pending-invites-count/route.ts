import { getActiveSession } from "@/lib/authz"
import { getNotificationCounts } from "@/lib/notifications"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return Response.json({ data: { count: 0 } }, { status: 200 })
  }

  try {
    const counts = await getNotificationCounts(activeSession.user)

    return Response.json(
      { data: { count: counts.pendingInvites } },
      { status: 200 },
    )
  } catch (error) {
    console.error("[GET /api/user/pending-invites-count]", error)
    return Response.json({ data: { count: 0 } }, { status: 200 })
  }
}
