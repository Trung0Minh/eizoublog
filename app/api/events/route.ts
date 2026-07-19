import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const events = await prisma.awardEvent.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        _count: { select: { rooms: true } },
        finalPost: { select: { slug: true, status: true } },
        id: true,
        openedAt: true,
        rooms: {
          select: { id: true, status: true, updatedAt: true },
          where: { writerId: activeSession.user.id },
        },
        slug: true,
        status: true,
        title: true,
        updatedAt: true,
      },
      where: { status: { in: ["OPEN", "CLOSED"] } },
    })

    return Response.json({ data: { events } })
  } catch (error) {
    console.error("[GET /api/events]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
