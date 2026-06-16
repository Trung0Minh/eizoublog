import { AwardEventError, joinAwardEvent } from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const room = await joinAwardEvent(id, activeSession.user.id)

    return Response.json({ data: room }, { status: 201 })
  } catch (error) {
    if (error instanceof AwardEventError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[POST /api/events/[id]/join]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
