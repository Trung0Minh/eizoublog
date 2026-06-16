import { ZodError, z } from "zod"

import {
  AwardEventError,
  updateAwardEventRoom,
} from "@/lib/awardEventService"
import { emptyAwardEventDoc } from "@/lib/awardEvents"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const updateRoomSchema = z.object({
  content: z.record(z.string(), z.unknown()).default(emptyAwardEventDoc),
  contentText: z.string().default(""),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
  visibility: z.enum(["PRIVATE", "PARTICIPANTS"]).default("PRIVATE"),
  writerIntro: z.string().max(1000).default(""),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const event = await prisma.awardEvent.findUnique({
      select: {
        finalPost: { select: { slug: true } },
        id: true,
        rooms: {
          select: {
            content: true,
            contentText: true,
            id: true,
            status: true,
            updatedAt: true,
            visibility: true,
            writerIntro: true,
          },
          where: { writerId: activeSession.user.id },
        },
        slug: true,
        status: true,
        title: true,
      },
      where: { id },
    })

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

    return Response.json({ data: { event, room: event.rooms[0] ?? null } })
  } catch (error) {
    console.error("[GET /api/events/[id]/room]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const data = updateRoomSchema.parse(await request.json())
    const room = await updateAwardEventRoom({
      content: data.content,
      contentText: data.contentText,
      eventId: id,
      status: data.status,
      visibility: data.visibility,
      writerId: activeSession.user.id,
      writerIntro: data.writerIntro,
    })

    return Response.json({ data: room })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof AwardEventError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[PATCH /api/events/[id]/room]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
