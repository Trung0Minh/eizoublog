import { Prisma, type PostReviewRequestContext } from "@prisma/client"

import {
  getPostSnapshotChecksum,
  type PostRecoverySnapshot,
} from "@/lib/postDurability"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"
import { ensureUniqueSlug, generateSlug } from "@/lib/utils"
import { regenerateEventPostIfExists } from "@/lib/awardEventService"

export interface PostReviewSnapshot extends PostRecoverySnapshot {
  coAuthorIds: string[]
  tagIds: string[]
}

interface CreatePostReviewRequestInput {
  context: PostReviewRequestContext
  eventId?: string | null
  eventRoomId?: string | null
  postId: string
  requesterId: string
  requestedPostVersion: number
  snapshot: PostReviewSnapshot
}

interface ReviewActor {
  id: string
  name: string
}

export class PostReviewRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

export function parsePostReviewSnapshot(value: unknown): PostReviewSnapshot {
  if (!isRecord(value)) {
    throw new Error("Invalid review snapshot")
  }

  const content = value.content
  if (!isRecord(content)) {
    throw new Error("Invalid review snapshot")
  }

  return {
    authorId: typeof value.authorId === "string" ? value.authorId : "",
    categoryId: typeof value.categoryId === "string" ? value.categoryId : null,
    coAuthorIds: stringArrayValue(value.coAuthorIds),
    content: content as Prisma.JsonValue,
    contentText:
      typeof value.contentText === "string" ? value.contentText : null,
    coverAlt: typeof value.coverAlt === "string" ? value.coverAlt : null,
    coverUrl: typeof value.coverUrl === "string" ? value.coverUrl : null,
    draftVisibility:
      value.draftVisibility === "CO_AUTHORS" ? "CO_AUTHORS" : "PRIVATE",
    excerpt: typeof value.excerpt === "string" ? value.excerpt : null,
    excerptContent:
      value.excerptContent === null || isRecord(value.excerptContent)
        ? (value.excerptContent as Prisma.JsonValue | null)
        : null,
    publishedAt:
      typeof value.publishedAt === "string" ? value.publishedAt : null,
    removedAt: typeof value.removedAt === "string" ? value.removedAt : null,
    removedFromStatus:
      value.removedFromStatus === "DRAFT" ||
      value.removedFromStatus === "PUBLISHED" ||
      value.removedFromStatus === "ARCHIVED" ||
      value.removedFromStatus === "REMOVED"
        ? value.removedFromStatus
        : null,
    slug: typeof value.slug === "string" ? value.slug : "",
    status:
      value.status === "DRAFT" ||
      value.status === "PUBLISHED" ||
      value.status === "ARCHIVED" ||
      value.status === "REMOVED"
        ? value.status
        : "DRAFT",
    tagIds: stringArrayValue(value.tagIds),
    title: typeof value.title === "string" ? value.title : "Untitled",
    version: typeof value.version === "number" ? value.version : 1,
  }
}

export async function createPostReviewRequest(
  input: CreatePostReviewRequestInput,
) {
  return prisma.$transaction(async (tx) => {
    return createPostReviewRequestWithClient(tx, input)
  })
}

export async function createPostReviewRequestWithClient(
  tx: Prisma.TransactionClient,
  input: CreatePostReviewRequestInput,
) {
    if (input.context === "AWARD_EVENT_ROOM") {
      if (!input.eventId || !input.eventRoomId) {
        throw new PostReviewRequestError(
          "Event review request is missing event context",
          400,
        )
      }

      const room = await tx.awardEventRoom.findFirst({
        select: { id: true },
        where: {
          eventId: input.eventId,
          id: input.eventRoomId,
          postId: input.postId,
          writerId: input.requesterId,
        },
      })

      if (!room) {
        throw new PostReviewRequestError(
          "Event review request is not authorized",
          403,
        )
      }
    }

    const existing = await tx.postReviewRequest.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true },
      where: {
        context: input.context,
        eventRoomId: input.eventRoomId ?? null,
        postId: input.postId,
        requesterId: input.requesterId,
        status: "PENDING",
      },
    })

    const request = existing
      ? await tx.postReviewRequest.update({
          data: {
            eventId: input.eventId ?? null,
            eventRoomId: input.eventRoomId ?? null,
            requestedPostVersion: input.requestedPostVersion,
            snapshot: input.snapshot as unknown as Prisma.InputJsonObject,
          },
          select: { id: true },
          where: { id: existing.id },
        })
      : await tx.postReviewRequest.create({
          data: {
            context: input.context,
            eventId: input.eventId ?? null,
            eventRoomId: input.eventRoomId ?? null,
            postId: input.postId,
            requestedPostVersion: input.requestedPostVersion,
            requesterId: input.requesterId,
            snapshot: input.snapshot as unknown as Prisma.InputJsonObject,
          },
          select: { id: true },
        })

    const admins = await tx.user.findMany({
      select: { id: true },
      where: {
        id: { not: input.requesterId },
        role: "ADMIN",
      },
    })

    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin) => ({
          data: {
            context: input.context,
            eventId: input.eventId ?? null,
            eventRoomId: input.eventRoomId ?? null,
            postId: input.postId,
            postTitle: input.snapshot.title,
            requesterId: input.requesterId,
            reviewRequestId: request.id,
            status: "PENDING",
          },
          type: "POST_REVIEW_REQUEST",
          userId: admin.id,
        })),
      })
    }

    return request
}

export async function acceptPostReviewRequest(
  requestId: string,
  actor: ReviewActor,
) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.postReviewRequest.findUnique({
      select: {
        context: true,
        eventId: true,
        eventRoomId: true,
        id: true,
        post: { select: { slug: true, status: true } },
        postId: true,
        requesterId: true,
        snapshot: true,
        status: true,
      },
      where: { id: requestId },
    })

    if (!request || request.status !== "PENDING") {
      throw new Error("Review request is not pending")
    }

    const snapshot = parsePostReviewSnapshot(request.snapshot)
    let postSlug = request.post.slug

    if (request.context === "AWARD_EVENT_ROOM") {
      if (!request.eventRoomId) {
        throw new Error("Event review request is missing its room")
      }

      await tx.awardEventRoom.update({
        data: {
          submittedContent: snapshot.content as Prisma.InputJsonValue,
          submittedPostId: request.postId,
          submittedPostTitle: snapshot.title,
          submittedPostVersion: snapshot.version,
        },
        where: { id: request.eventRoomId },
      })
    } else {
      let slug = snapshot.slug
      if (snapshot.title) {
        const baseSlug = generateSlug(snapshot.title) || "post"
        slug = await ensureUniqueSlug(baseSlug, tx, request.postId)
      }

      const existingCoAuthors = await tx.postAuthor.findMany({
        where: { postId: request.postId },
      })
      const coAuthorIds = Array.from(new Set(snapshot.coAuthorIds))
      const coAuthorsToDelete = existingCoAuthors.filter(
        (coAuthor) => !coAuthorIds.includes(coAuthor.userId),
      )
      if (coAuthorsToDelete.length > 0) {
        await tx.postAuthor.deleteMany({
          where: {
            postId: request.postId,
            userId: { in: coAuthorsToDelete.map(({ userId }) => userId) },
          },
        })
      }
      for (let order = 0; order < coAuthorIds.length; order += 1) {
        const userId = coAuthorIds[order]
        const existing = existingCoAuthors.find(
          (coAuthor) => coAuthor.userId === userId,
        )
        if (existing) {
          await tx.postAuthor.update({
            data: { order },
            where: { postId_userId: { postId: request.postId, userId } },
          })
        } else {
          await tx.postAuthor.create({
            data: {
              order,
              postId: request.postId,
              status: "PENDING",
              userId,
            },
          })
        }
      }

      const existingTags = await tx.postTag.findMany({
        where: { postId: request.postId },
      })
      const tagIds = Array.from(new Set(snapshot.tagIds))
      const tagsToDelete = existingTags.filter(
        (tag) => !tagIds.includes(tag.tagId),
      )
      if (tagsToDelete.length > 0) {
        await tx.postTag.deleteMany({
          where: {
            postId: request.postId,
            tagId: { in: tagsToDelete.map(({ tagId }) => tagId) },
          },
        })
      }
      const tagsToCreate = tagIds.filter(
        (tagId) => !existingTags.some((tag) => tag.tagId === tagId),
      )
      if (tagsToCreate.length > 0) {
        await tx.postTag.createMany({
          data: tagsToCreate.map((tagId) => ({
            postId: request.postId,
            tagId,
          })),
        })
      }

      const updated = await tx.post.update({
        data: {
          category: snapshot.categoryId
            ? { connect: { id: snapshot.categoryId } }
            : { disconnect: true },
          content: snapshot.content as Prisma.InputJsonObject,
          contentText: snapshot.contentText?.trim() || null,
          coverAlt: snapshot.coverAlt?.trim() || null,
          coverUrl: snapshot.coverUrl,
          draftVisibility: snapshot.draftVisibility,
          excerpt: snapshot.excerpt || null,
          excerptContent:
            snapshot.excerptContent === null
              ? Prisma.JsonNull
              : (snapshot.excerptContent as Prisma.InputJsonObject),
          lastSavedAt: new Date(),
          moderationLockedAt: null,
          publishedAt:
            request.post.status === "PUBLISHED" ? undefined : new Date(),
          removedAt: null,
          removedFromStatus: null,
          slug,
          status: "PUBLISHED",
          title: snapshot.title,
          version: { increment: 1 },
        },
        select: { slug: true, version: true },
        where: { id: request.postId },
      })
      postSlug = updated.slug

      const revisionSnapshot: PostReviewSnapshot = {
        ...snapshot,
        publishedAt: new Date().toISOString(),
        removedAt: null,
        removedFromStatus: null,
        slug,
        status: "PUBLISHED",
        version: updated.version,
      }

      await tx.postRevision.create({
        data: {
          actorId: actor.id,
          checksum: getPostSnapshotChecksum(revisionSnapshot),
          kind: "PUBLISH",
          postId: request.postId,
          snapshot: revisionSnapshot as unknown as Prisma.InputJsonObject,
          sourceVersion: updated.version,
        },
      })
      await tx.postAuditEvent.create({
        data: {
          action: "MODERATION",
          actorId: actor.id,
          metadata: { reviewRequestId: request.id, reviewStatus: "ACCEPTED" },
          postId: request.postId,
          sourceVersion: updated.version,
        },
      })
    }

    await tx.postReviewRequest.update({
      data: {
        decidedAt: new Date(),
        decidedById: actor.id,
        status: "ACCEPTED",
      },
      where: { id: request.id },
    })

    await tx.notification.create({
      data: {
        data: {
          actorName: actor.name,
          context: request.context,
          eventId: request.eventId,
          eventRoomId: request.eventRoomId,
          postId: request.postId,
          postTitle: snapshot.title,
          reviewRequestId: request.id,
          status: "ACCEPTED",
        },
        type: "POST_REVIEW_DECISION",
        userId: request.requesterId,
      },
    })

    return {
      context: request.context,
      eventId: request.eventId,
      postSlug,
    }
  })

  if (result.context === "AWARD_EVENT_ROOM" && result.eventId) {
    await regenerateEventPostIfExists(result.eventId)
  } else {
    revalidatePostMutationPaths([result.postSlug])
  }
}

export async function declinePostReviewRequest(
  requestId: string,
  actor: ReviewActor,
  reason: string,
) {
  await prisma.$transaction(async (tx) => {
    const request = await tx.postReviewRequest.update({
      data: {
        decidedAt: new Date(),
        decidedById: actor.id,
        decisionReason: reason,
        status: "DECLINED",
      },
      select: {
        context: true,
        eventId: true,
        eventRoomId: true,
        id: true,
        postId: true,
        requesterId: true,
        snapshot: true,
      },
      where: {
        id: requestId,
        status: "PENDING",
      },
    })
    const snapshot = parsePostReviewSnapshot(request.snapshot)

    await tx.notification.create({
      data: {
        data: {
          actorName: actor.name,
          context: request.context,
          eventId: request.eventId,
          eventRoomId: request.eventRoomId,
          postId: request.postId,
          postTitle: snapshot.title,
          reason,
          reviewRequestId: request.id,
          status: "DECLINED",
        },
        type: "POST_REVIEW_DECISION",
        userId: request.requesterId,
      },
    })
  })
}
