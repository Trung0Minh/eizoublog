import type { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { emptyAwardEventDoc } from "@/lib/awardEvents"
import { awardEventListSelect } from "@/lib/awardEventService"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const createEventSchema = z.object({
  categoryId: z.string().min(1).optional(),
  coverAlt: z.string().max(200).optional(),
  coverUrl: z.string().url().optional(),
  intro: z.record(z.string(), z.unknown()).optional(),
  introText: z.string().max(5000).optional(),
  slug: z.string().trim().max(220).optional(),
  tagIds: z.array(z.string().min(1)).default([]),
  title: z.string().trim().min(1).max(200),
})

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

async function ensureUniqueAwardEventSlug(baseSlug: string) {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.awardEvent.findUnique({
      select: { id: true },
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const events = await prisma.awardEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: awardEventListSelect,
    })

    return Response.json({ data: { events } })
  } catch (error) {
    console.error("[GET /api/admin/events]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = createEventSchema.parse(await request.json())
    const baseSlug = generateSlug(data.slug || data.title) || "event"
    const slug = await ensureUniqueAwardEventSlug(baseSlug)
    const event = await prisma.awardEvent.create({
      data: {
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        coverAlt: data.coverAlt?.trim() || undefined,
        coverUrl: data.coverUrl,
        createdBy: { connect: { id: activeSession.user.id } },
        intro: (data.intro ?? emptyAwardEventDoc) as Prisma.InputJsonObject,
        introText: data.introText?.trim() || undefined,
        slug,
        tags: {
          create: uniqueIds(data.tagIds).map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        title: data.title,
      },
      select: awardEventListSelect,
    })

    revalidateTag("award-events", "max")

    return Response.json({ data: event }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/admin/events]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
