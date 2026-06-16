import { AwardEventError, shuffleSubmittedRooms } from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const rooms = await shuffleSubmittedRooms(id)

    return Response.json({ data: { rooms } })
  } catch (error) {
    if (error instanceof AwardEventError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[POST /api/admin/events/[id]/shuffle]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
