import type { AwardEventStatus, Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import {
  AwardEventError,
  awardEventDetailSelect,
  regeneratePublishedEventIfNeeded,
} from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const updateEventSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  coverAlt: z.string().max(200).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  intro: z.record(z.string(), z.unknown()).optional(),
  introText: z.string().max(5000).optional(),
  roomOrder: z.array(z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  })).optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  title: z.string().trim().min(1).max(200).optional(),
})

function getStatusDates(status: AwardEventStatus | undefined) {
  if (status === "OPEN") {
    return { openedAt: new Date() }
  }

  if (status === "CLOSED" || status === "ARCHIVED") {
    return { closedAt: new Date() }
  }

  return {}
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const event = await prisma.awardEvent.findUnique({
      select: awardEventDetailSelect,
      where: { id },
    })

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

    return Response.json({ data: event })
  } catch (error) {
    console.error("[GET /api/admin/events/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const data = updateEventSchema.parse(await request.json())

    const event = await prisma.$transaction(async (tx) => {
      if (data.roomOrder) {
        await Promise.all(
          data.roomOrder.map((room) =>
            tx.awardEventRoom.updateMany({
              data: { order: room.order },
              where: { eventId: id, id: room.id },
            }),
          ),
        )
      }

      return tx.awardEvent.update({
        data: {
          ...(data.categoryId !== undefined && {
            category: data.categoryId
              ? { connect: { id: data.categoryId } }
              : { disconnect: true },
          }),
          ...(data.coverAlt !== undefined && {
            coverAlt: data.coverAlt?.trim() || null,
          }),
          ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
          ...(data.intro !== undefined && {
            intro: data.intro as Prisma.InputJsonObject,
          }),
          ...(data.introText !== undefined && {
            introText: data.introText.trim() || null,
          }),
          ...(data.status && { status: data.status, ...getStatusDates(data.status) }),
          ...(data.tagIds && {
            tags: {
              create: uniqueIds(data.tagIds).map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
              deleteMany: {},
            },
          }),
          ...(data.title && { title: data.title }),
        },
        select: awardEventDetailSelect,
        where: { id },
      })
    })

    await regeneratePublishedEventIfNeeded(id)
    revalidateTag("award-events", "max")

    return Response.json({ data: event })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof AwardEventError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[PATCH /api/admin/events/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
