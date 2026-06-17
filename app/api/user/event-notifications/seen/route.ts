import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { markOpenEventsSeen } from "@/lib/eventNotifications"

export async function POST() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const result = await markOpenEventsSeen(activeSession.user.id)

    return Response.json({ data: result })
  } catch (error) {
    console.error("[POST /api/user/event-notifications/seen]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
