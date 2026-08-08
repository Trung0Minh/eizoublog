import { ZodError, z } from "zod"

import {
  AwardEventError,
  regenerateEventPostIfExists,
  updateAwardEventRoom,
} from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const updateRoomSchema = z.object({
  postId: z.string().nullable().default(null),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
  visibility: z.enum(["PRIVATE", "PARTICIPANTS"]).default("PRIVATE"),
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
            id: true,
            postId: true,
            selectedPost: {
              select: {
                id: true,
                status: true,
                title: true,
                version: true,
              },
            },
            status: true,
            submittedPostId: true,
            submittedPostVersion: true,
            updatedAt: true,
            visibility: true,
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
      eventId: id,
      postId: data.postId,
      status: data.status,
      visibility: data.visibility,
      writerId: activeSession.user.id,
    })

    if (data.status === "SUBMITTED") {
      await regenerateEventPostIfExists(id)
    }

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
