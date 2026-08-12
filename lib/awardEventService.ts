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
  mergeAwardEventTags,
  shuffleSubmittedAwardEventRooms,
} from "@/lib/awardEvents"
import { prisma } from "@/lib/prisma"
import { truncatePostExcerpt } from "@/lib/postLimits"
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
  finalPost: { select: { status: true } },
  id: true,
  openedAt: true,
  slug: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.AwardEventSelect

export const awardEventDetailSelect = {
  category: { select: { name: true, slug: true } },
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
  rooms: {
    orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
    select: {
      _count: { select: { comments: true } },
      createdAt: true,
      excludedAt: true,
      id: true,
      order: true,
      postId: true,
      submittedContent: true,
      submittedPostId: true,
      submittedPostTitle: true,
      submittedPostVersion: true,
      selectedPost: {
        select: {
          content: true,
          id: true,
          status: true,
          tags: {
            select: { tag: { select: { id: true, name: true, slug: true } } },
          },
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
      submittedContent: false,
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

export async function regenerateAwardEventPost(
  eventId: string,
  options: { publish?: boolean } = {},
) {
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
      selectedPost: room.submittedContent
        ? {
            content: normalizeAwardEventContent(room.submittedContent),
            id: room.submittedPostId ?? room.selectedPost?.id ?? room.id,
            status: "DRAFT" as const,
            tags: room.selectedPost?.tags?.map(({ tag }) => tag) ?? [],
            title: room.submittedPostTitle ?? room.selectedPost?.title ?? "Untitled",
          }
        : room.selectedPost
          ? {
              content: normalizeAwardEventContent(room.selectedPost.content),
              id: room.selectedPost.id,
              status: room.selectedPost.status,
              tags: room.selectedPost.tags.map(({ tag }) => tag),
              title: room.selectedPost.title,
            }
          : null,
      status: room.status,
      writer: room.writer,
    }))
  const content = buildAwardEventPostContent({
    eventIntro: normalizeAwardEventContent(event.intro),
    rooms,
  })
  const contentText = flattenAwardEventText(content)
  const tagIds = mergeAwardEventTags(
    event.tags.map(({ tag }) => tag),
    event.rooms.map((room) => ({
      selectedPost: room.selectedPost
        ? { tags: room.selectedPost.tags?.map(({ tag }) => tag) ?? [] }
        : null,
    })),
  ).flatMap((tag) => (tag.id ? [tag.id] : []))

  const post = await prisma.$transaction(async (tx) => {
    if (event.finalPostId) {
      const nextStatus = options.publish
        ? "PUBLISHED"
        : event.finalPost?.status === "PUBLISHED"
          ? "PUBLISHED"
          : "DRAFT"
      return tx.post.update({
        data: {
          category: event.categoryId
            ? { connect: { id: event.categoryId } }
            : { disconnect: true },
          content: content as Prisma.InputJsonObject,
          contentText,
          coverAlt: event.coverAlt,
          coverUrl: event.coverUrl,
          excerpt: truncatePostExcerpt(event.introText),
          lastSavedAt: new Date(),
          moderationLockedAt: null,
          publishedAt:
            nextStatus === "PUBLISHED"
              ? event.finalPost?.status === "PUBLISHED"
                ? undefined
                : new Date()
              : null,
          removedAt: null,
          removedFromStatus: null,
          status: nextStatus,
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
        excerpt: truncatePostExcerpt(event.introText) || undefined,
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
      },
      where: { id: event.id },
    })

    return createdPost
  })

  revalidateTag("posts", "max")
  revalidatePath(`/${post.slug}`)

  return post
}

export async function unpublishAwardEventPost(eventId: string) {
  const event = await prisma.awardEvent.findUnique({
    select: { finalPostId: true },
    where: { id: eventId },
  })

  if (!event) {
    throw new AwardEventError("Event not found", 404)
  }

  if (!event.finalPostId) {
    return null
  }

  const post = await prisma.post.update({
    data: {
      featuredAt: null,
      moderationLockedAt: null,
      publishedAt: null,
      removedAt: null,
      removedFromStatus: null,
      status: "DRAFT",
    },
    select: { id: true, slug: true, status: true },
    where: { id: event.finalPostId },
  })

  revalidateTag("posts", "max")
  revalidatePath(`/${post.slug}`)

  return post
}

export async function regenerateEventPostIfExists(eventId: string) {
  const event = await prisma.awardEvent.findUnique({
    select: { finalPostId: true },
    where: { id: eventId },
  })

  if (event?.finalPostId) {
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

  if (event.status !== "OPEN") {
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
}: {
  eventId: string
  postId: string | null
  status?: AwardEventRoomStatus
  visibility: AwardEventRoomVisibility
  writerId: string
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const room = await tx.awardEventRoom.findUnique({
      select: { event: { select: { status: true } }, id: true },
      where: { eventId_writerId: { eventId, writerId } },
    })

    if (!room) {
      throw new AwardEventError("Room not found", 404)
    }

    if (room.event.status === "CLOSED") {
      throw new AwardEventError("Event is closed", 400)
    }

    if (status === "SUBMITTED" && !postId) {
      throw new AwardEventError("Select a post before submitting", 400)
    }

    let snapshotData: {
      submittedContent?: Prisma.InputJsonValue
      submittedPostId?: string
      submittedPostTitle?: string
      submittedPostVersion?: number
      submittedWriterIntro?: string | null
    } = {}

    if (postId) {
      const selectedPost = await tx.post.findFirst({
        select: {
          content: true,
          id: true,
          status: true,
          title: true,
          version: true,
        },
        where: {
          authorId: writerId,
          finalAwardEvent: null,
          id: postId,
          status: { in: ["DRAFT", "PUBLISHED"] },
        },
      })

      if (!selectedPost) {
        throw new AwardEventError("Selected post not found", 404)
      }

      if (status === "SUBMITTED") {
        snapshotData = {
          submittedContent: selectedPost.content as Prisma.InputJsonValue,
          submittedPostId: selectedPost.id,
          submittedPostTitle: selectedPost.title,
          submittedPostVersion: selectedPost.version,
          submittedWriterIntro: null,
        }
      }
    }

    return tx.awardEventRoom.update({
      data: {
        postId,
        ...snapshotData,
        ...(status && {
          status,
          submittedAt: status === "SUBMITTED" ? new Date() : null,
        }),
        visibility,
        writerIntro: null,
      },
      select: {
        id: true,
        postId: true,
        status: true,
        submittedAt: true,
        submittedPostId: true,
        submittedPostTitle: true,
        submittedPostVersion: true,
        visibility: true,
      },
      where: { id: room.id },
    })
  })

  await regenerateEventPostIfExists(eventId)
  revalidateTag("posts", "max")

  return updated
}

export async function shuffleSubmittedRooms(eventId: string) {
  const rooms = await prisma.awardEventRoom.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
    select: { excludedAt: true, id: true, order: true, status: true },
    where: { eventId },
  })
  const ordered = shuffleSubmittedAwardEventRooms(rooms)

  await prisma.$transaction(
    ordered.map((room) =>
      prisma.awardEventRoom.update({
        data: { order: room.order },
        where: { id: room.id },
      }),
    ),
  )

  await regenerateEventPostIfExists(eventId)

  return ordered.map(({ id, order }) => ({ id, order }))
}
