import { z, ZodError } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

async function canAccessRoom({
  eventId,
  roomId,
  userId,
  userRole,
}: {
  eventId: string
  roomId: string
  userId: string
  userRole: string
}) {
  const room = await prisma.awardEventRoom.findUnique({
    select: {
      eventId: true,
      id: true,
      visibility: true,
      writerId: true,
    },
    where: { id: roomId },
  })

  if (!room || room.eventId !== eventId) {
    return false
  }

  if (userRole === "ADMIN" || room.writerId === userId) {
    return true
  }

  if (room.visibility !== "PARTICIPANTS") {
    return false
  }

  const participant = await prisma.awardEventRoom.findUnique({
    select: { id: true },
    where: { eventId_writerId: { eventId, writerId: userId } },
  })

  return Boolean(participant)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id, roomId } = await params
    const allowed = await canAccessRoom({
      eventId: id,
      roomId,
      userId: activeSession.user.id,
      userRole: activeSession.user.role,
    })

    if (!allowed) {
      return Response.json({ error: "Room not found" }, { status: 404 })
    }

    const comments = await prisma.awardEventRoomComment.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        author: { select: { name: true, username: true } },
        authorId: true,
        content: true,
        createdAt: true,
        id: true,
      },
      where: { roomId },
    })

    return Response.json({ data: { comments } })
  } catch (error) {
    console.error("[GET /api/events/[id]/rooms/[roomId]/comments]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id, roomId } = await params
    const allowed = await canAccessRoom({
      eventId: id,
      roomId,
      userId: activeSession.user.id,
      userRole: activeSession.user.role,
    })

    if (!allowed) {
      return Response.json({ error: "Room not found" }, { status: 404 })
    }

    const data = commentSchema.parse(await request.json())
    const comment = await prisma.awardEventRoomComment.create({
      data: {
        authorId: activeSession.user.id,
        content: data.content,
        roomId,
      },
      select: {
        author: { select: { name: true, username: true } },
        content: true,
        createdAt: true,
        id: true,
      },
    })

    return Response.json({ data: comment }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/events/[id]/rooms/[roomId]/comments]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
