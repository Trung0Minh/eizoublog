import { revalidateTag } from "next/cache"

import { regenerateEventPostIfExists } from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id, roomId } = await params
    const room = await prisma.awardEventRoom.findFirst({
      select: { id: true },
      where: { eventId: id, id: roomId },
    })

    if (!room) {
      return Response.json({ error: "Participant not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.awardEventRoom.delete({
        select: { id: true },
        where: { id: room.id },
      })
      const remainingRooms = await tx.awardEventRoom.findMany({
        orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
        select: { id: true, order: true },
        where: { eventId: id },
      })

      await Promise.all(
        remainingRooms.map((remainingRoom, order) =>
          tx.awardEventRoom.update({
            data: { order },
            select: { id: true },
            where: { id: remainingRoom.id },
          }),
        ),
      )
    })

    await regenerateEventPostIfExists(id)
    revalidateTag("award-events", "max")

    return Response.json({ data: { message: "Participant removed" } })
  } catch (error) {
    console.error("[DELETE /api/admin/events/[id]/rooms/[roomId]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
