import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  Prisma,
} from "@prisma/client"
import type { JSONContent } from "@tiptap/react"
import { revalidatePath, revalidateTag } from "next/cache"

import {
  buildAwardEventPostContent,
  emptyAwardEventDoc,
  flattenAwardEventText,
  shuffleAwardEventRooms,
} from "@/lib/awardEvents"
import { prisma } from "@/lib/prisma"
import { ensureUniqueSlug, generateSlug } from "@/lib/utils"

export class AwardEventError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export const awardEventListSelect = {
  _count: { select: { rooms: true } },
  closedAt: true,
  createdAt: true,
  id: true,
  openedAt: true,
  publishedAt: true,
  slug: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.AwardEventSelect

export const awardEventDetailSelect = {
  categoryId: true,
  closedAt: true,
  coverAlt: true,
  coverUrl: true,
  createdAt: true,
  createdById: true,
  finalPost: {
    select: { id: true, slug: true, status: true },
  },
  finalPostId: true,
  id: true,
  intro: true,
  introText: true,
  openedAt: true,
  publishedAt: true,
  rooms: {
    orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
    select: {
      _count: { select: { comments: true } },
      createdAt: true,
      excludedAt: true,
      id: true,
      order: true,
      postId: true,
      selectedPost: {
        select: {
          content: true,
          id: true,
          status: true,
          title: true,
        },
      },
      status: true,
      submittedAt: true,
      updatedAt: true,
      visibility: true,
      writer: {
        select: {
          avatarUrl: true,
          bio: true,
          id: true,
          name: true,
          role: true,
          username: true,
        },
      },
      writerId: true,
      writerIntro: true,
    },
  },
  slug: true,
  status: true,
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  title: true,
  updatedAt: true,
} satisfies Prisma.AwardEventSelect

export const adminAwardEventDetailSelect = {
  ...awardEventDetailSelect,
  rooms: {
    ...awardEventDetailSelect.rooms,
    select: {
      ...awardEventDetailSelect.rooms.select,
      selectedPost: {
        select: {
          id: true,
          status: true,
          title: true,
        },
      },
    },
  },
} satisfies Prisma.AwardEventSelect

export type AwardEventDetail = Prisma.AwardEventGetPayload<{
  select: typeof awardEventDetailSelect
}>

export function normalizeAwardEventContent(content: unknown): JSONContent {
  if (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    content.type === "doc"
  ) {
    if (
      !("content" in content) ||
      !Array.isArray(content.content) ||
      content.content.length === 0
    ) {
      return emptyAwardEventDoc
    }

    return content as JSONContent
  }

  return emptyAwardEventDoc
}

export async function regenerateAwardEventPost(eventId: string) {
  const event = await prisma.awardEvent.findUnique({
    select: awardEventDetailSelect,
    where: { id: eventId },
  })

  if (!event) {
    throw new AwardEventError("Event not found", 404)
  }

  const rooms = event.rooms
    .filter((room) => !room.excludedAt)
    .map((room) => ({
      id: room.id,
      order: room.order,
      selectedPost: room.selectedPost
        ? {
            content: normalizeAwardEventContent(room.selectedPost.content),
            id: room.selectedPost.id,
            status: room.selectedPost.status,
            title: room.selectedPost.title,
          }
        : null,
      status: room.status,
      writer: room.writer,
      writerIntro: room.writerIntro,
    }))
  const content = buildAwardEventPostContent({
    eventIntro: normalizeAwardEventContent(event.intro),
    rooms,
  })
  const contentText = flattenAwardEventText(content)
  const tagIds = event.tags.map(({ tag }) => tag.id)

  const post = await prisma.$transaction(async (tx) => {
    if (event.finalPostId) {
      return tx.post.update({
        data: {
          category: event.categoryId
            ? { connect: { id: event.categoryId } }
            : { disconnect: true },
          content: content as Prisma.InputJsonObject,
          contentText,
          coverAlt: event.coverAlt,
          coverUrl: event.coverUrl,
          excerpt: event.introText?.slice(0, 500) || null,
          lastSavedAt: new Date(),
          publishedAt: event.publishedAt ?? new Date(),
          status: "PUBLISHED",
          tags: {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
            deleteMany: {},
          },
          title: event.title,
        },
        select: { id: true, slug: true, status: true },
        where: { id: event.finalPostId },
      })
    }

    const baseSlug = generateSlug(event.slug || event.title) || "event"
    const slug = await ensureUniqueSlug(baseSlug, tx)
    const createdPost = await tx.post.create({
      data: {
        author: { connect: { id: event.createdById } },
        category: event.categoryId ? { connect: { id: event.categoryId } } : undefined,
        content: content as Prisma.InputJsonObject,
        contentText,
        coverAlt: event.coverAlt,
        coverUrl: event.coverUrl,
        excerpt: event.introText?.slice(0, 500) || undefined,
        publishedAt: new Date(),
        slug,
        status: "PUBLISHED",
        tags: {
          create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
        title: event.title,
      },
      select: { id: true, slug: true, status: true },
    })

    await tx.awardEvent.update({
      data: {
        finalPostId: createdPost.id,
        publishedAt: new Date(),
        status: "PUBLISHED",
      },
      where: { id: event.id },
    })

    return createdPost
  })

  revalidateTag("posts", "max")
  revalidatePath(`/${post.slug}`)

  return post
}

export async function regeneratePublishedEventIfNeeded(eventId: string) {
  const event = await prisma.awardEvent.findUnique({
    select: { finalPostId: true, status: true },
    where: { id: eventId },
  })

  if (event?.status === "PUBLISHED" && event.finalPostId) {
    await regenerateAwardEventPost(eventId)
  }
}

export async function joinAwardEvent(eventId: string, writerId: string) {
  const event = await prisma.awardEvent.findUnique({
    select: { id: true, status: true },
    where: { id: eventId },
  })

  if (!event) {
    throw new AwardEventError("Event not found", 404)
  }

  if (event.status !== "OPEN" && event.status !== "PUBLISHED") {
    throw new AwardEventError("Event is not open", 400)
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.awardEventRoom.findUnique({
      where: { eventId_writerId: { eventId, writerId } },
    })

    if (existing) {
      return existing
    }

    const lastRoom = await tx.awardEventRoom.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
      where: { eventId },
    })

    return tx.awardEventRoom.create({
      data: {
        content: emptyAwardEventDoc as Prisma.InputJsonObject,
        eventId,
        order: (lastRoom?.order ?? -1) + 1,
        writerId,
      },
    })
  })
}

export async function updateAwardEventRoom({
  eventId,
  postId,
  status,
  visibility,
  writerId,
  writerIntro,
}: {
  eventId: string
  postId: string | null
  status?: AwardEventRoomStatus
  visibility: AwardEventRoomVisibility
  writerId: string
  writerIntro: string
}) {
  const room = await prisma.awardEventRoom.findUnique({
    select: { event: { select: { status: true } }, id: true },
    where: { eventId_writerId: { eventId, writerId } },
  })

  if (!room) {
    throw new AwardEventError("Room not found", 404)
  }

  if (room.event.status === "ARCHIVED" || room.event.status === "CLOSED") {
    throw new AwardEventError("Event is closed", 400)
  }

  if (status === "SUBMITTED" && !postId) {
    throw new AwardEventError("Select a post before submitting", 400)
  }

  if (postId) {
    const selectedPost = await prisma.post.findFirst({
      select: { id: true, status: true },
      where: {
        authorId: writerId,
        id: postId,
        status: { in: ["DRAFT", "PUBLISHED"] },
      },
    })

    if (!selectedPost) {
      throw new AwardEventError("Selected post not found", 404)
    }
  }

  const updated = await prisma.awardEventRoom.update({
    data: {
      postId,
      ...(status && {
        status,
        submittedAt: status === "SUBMITTED" ? new Date() : null,
      }),
      visibility,
      writerIntro: writerIntro.trim() || null,
    },
    where: { id: room.id },
  })

  await regeneratePublishedEventIfNeeded(eventId)

  return updated
}

export async function shuffleSubmittedRooms(eventId: string) {
  const rooms = await prisma.awardEventRoom.findMany({
    select: { id: true, order: true },
    where: {
      eventId,
      excludedAt: null,
      status: "SUBMITTED",
    },
  })
  const shuffled = shuffleAwardEventRooms(rooms)

  await prisma.$transaction(
    shuffled.map((room) =>
      prisma.awardEventRoom.update({
        data: { order: room.order },
        where: { id: room.id },
      }),
    ),
  )

  await regeneratePublishedEventIfNeeded(eventId)

  return shuffled
}
