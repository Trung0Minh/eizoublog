import type { AwardEventStatus, Prisma } from "@prisma/client"
import { revalidatePath, revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import {
  AwardEventError,
  awardEventDetailSelect,
  regenerateEventPostIfExists,
} from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { getPostMediaUrls } from "@/lib/postMedia"

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
  roomExclusion: z.object({
    excluded: z.boolean(),
    id: z.string().min(1),
  }).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  title: z.string().trim().min(1).max(200).optional(),
})

const deleteEventSchema = z.object({
  confirmation: z.string().trim().min(1),
})

function getStatusDates(status: AwardEventStatus | undefined) {
  if (status === "OPEN") {
    return { openedAt: new Date() }
  }

  if (status === "CLOSED") {
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

    const mutations: Prisma.PrismaPromise<unknown>[] = []

    if (data.roomOrder) {
      mutations.push(
        ...data.roomOrder.map((room) =>
          prisma.awardEventRoom.updateMany({
            data: { order: room.order },
            where: { eventId: id, id: room.id },
          }),
        ),
      )
    }

    if (data.roomExclusion) {
      mutations.push(
        prisma.awardEventRoom.updateMany({
          data: { excludedAt: data.roomExclusion.excluded ? new Date() : null },
          where: { eventId: id, id: data.roomExclusion.id },
        }),
      )
    }

    const eventMutation = prisma.awardEvent.update({
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
    const results = await prisma.$transaction([...mutations, eventMutation])
    const event = results.at(-1) as Awaited<typeof eventMutation>

    await regenerateEventPostIfExists(id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const data = deleteEventSchema.parse(await request.json())
    const deleted = await prisma.$transaction(async (tx) => {
      const event = await tx.awardEvent.findUnique({
        select: {
          finalPost: {
            select: { content: true, coverUrl: true, id: true, slug: true, title: true },
          },
          id: true,
          title: true,
        },
        where: { id },
      })

      if (!event) {
        throw new AwardEventError("Event not found", 404)
      }

      if (data.confirmation !== event.title) {
        throw new AwardEventError("Event title does not match", 400)
      }

      if (event.finalPost) {
        const mediaUrls = getPostMediaUrls(event.finalPost)
        const otherPosts = mediaUrls.size > 0
          ? await tx.post.findMany({
              select: { content: true, coverUrl: true },
              where: { id: { not: event.finalPost.id } },
            })
          : []
        const sharedMediaUrls = new Set(
          otherPosts.flatMap((post) => Array.from(getPostMediaUrls(post))),
        )
        const ownedMediaUrls = Array.from(mediaUrls).filter(
          (url) => !sharedMediaUrls.has(url),
        )

        await tx.postAuditEvent.create({
          data: {
            action: "PURGE",
            actorId: activeSession.user.id,
            metadata: {
              eventId: event.id,
              reason: "Award event permanently removed",
              title: event.finalPost.title,
            },
            postId: event.finalPost.id,
            sourceVersion: null,
          },
          select: { id: true },
        })
        await tx.awardEventRoom.updateMany({
          data: { postId: null },
          where: { postId: event.finalPost.id },
        })
        await tx.notification.deleteMany({
          where: { data: { equals: event.finalPost.id, path: ["postId"] } },
        })
        await tx.analyticsEvent.deleteMany({
          where: { postSlug: event.finalPost.slug },
        })
        await tx.analyticsDailyPage.deleteMany({
          where: { postSlug: event.finalPost.slug },
        })
        await tx.postRevision.deleteMany({ where: { postId: event.finalPost.id } })
        if (ownedMediaUrls.length > 0) {
          await tx.mediaCleanupJob.create({
            data: { objectKeys: ownedMediaUrls },
            select: { id: true },
          })
        }
      }

      await tx.awardEvent.delete({
        select: { id: true },
        where: { id },
      })

      if (event.finalPost) {
        await tx.post.delete({
          select: { id: true },
          where: { id: event.finalPost.id },
        })
      }

      return { finalPostSlug: event.finalPost?.slug ?? null }
    })

    revalidateTag("award-events", "max")
    revalidateTag("posts", "max")
    if (deleted.finalPostSlug) {
      revalidatePath(`/${deleted.finalPostSlug}`)
    }

    return Response.json({ data: { message: "Event deleted" } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Type the event title to confirm deletion" },
        { status: 400 },
      )
    }

    if (error instanceof AwardEventError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/admin/events/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
