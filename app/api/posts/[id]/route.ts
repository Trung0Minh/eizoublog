import { Prisma, type Role } from "@prisma/client"
import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { canViewPost } from "@/lib/postAccess"
import { getPostMediaUrls } from "@/lib/postMedia"
import {
  getPostSnapshotChecksum,
  type PostRecoverySnapshot,
  validatePostContentSize,
} from "@/lib/postDurability"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"
import { MAX_POST_EXCERPT_CHARACTERS } from "@/lib/postLimits"
import {
  createPostReviewRequestWithClient,
  PostReviewRequestError,
} from "@/lib/postReviewRequests"
import { ensureUniqueSlug, generateSlug } from "@/lib/utils"

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const updateSchema = z.object({
  baseVersion: z.number().int().positive().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  coAuthorIds: z.array(z.string().min(1)).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  contentText: z.string().optional(),
  coverAlt: z.string().max(200).optional(),
  coverUrl: z.string().url().nullable().optional(),
  draftVisibility: z.enum(["PRIVATE", "CO_AUTHORS"]).optional(),
  eventId: z.string().min(1).optional(),
  eventRoomId: z.string().min(1).optional(),
  excerpt: z.string().trim().max(MAX_POST_EXCERPT_CHARACTERS).optional(),
  excerptContent: z.record(z.string(), z.unknown()).nullable().optional(),
  reviewContext: z.enum(["NORMAL_POST", "AWARD_EVENT_ROOM"]).optional(),
  saveKind: z.enum(["AUTO", "MANUAL"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  title: z.string().trim().min(1).max(200).optional(),
})

const permanentDeleteSchema = z.object({
  confirmation: z.string().min(1).max(200),
})
const HARD_DELETE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

const postDetailSelect = {
  _count: { select: { comments: true } },
  author: {
    select: {
      avatarUrl: true,
      bio: true,
      id: true,
      name: true,
      username: true,
    },
  },
  authorId: true,
  category: {
    select: { description: true, id: true, name: true, slug: true },
  },
  categoryId: true,
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      order: true,
      status: true,
      userId: true,
      user: {
        select: {
          avatarUrl: true,
          bio: true,
          id: true,
          name: true,
          username: true,
        },
      },
    },
  },
  content: true,
  contentText: true,
  coverAlt: true,
  coverUrl: true,
  createdAt: true,
  draftVisibility: true,
  excerpt: true,
  excerptContent: true,
  id: true,
  lastSavedAt: true,
  publishedAt: true,
  slug: true,
  status: true,
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  title: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

function canManagePost({
  authorId,
  user,
  coAuthors = [],
}: {
  authorId: string
  user: { id: string; role: Role }
  coAuthors?: { userId: string; status?: string }[]
}) {
  if (user.role === "ADMIN" || user.id === authorId) return true
  return coAuthors.some(
    (ca) => ca.userId === user.id && ca.status === "ACCEPTED",
  )
}

function canPerformOwnerAction({
  authorId,
  user,
}: {
  authorId: string
  user: { id: string; role: Role }
}) {
  return user.role === "ADMIN" || user.id === authorId
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const { id } = await params

  try {
    const post = await prisma.post.findUnique({
      select: postDetailSelect,
      where: { id },
    })

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    if (!canViewPost(post, session?.user.id, session?.user.role)) {
      let isParticipantViewer = false
      if (session?.user.id) {
        const sharedInEvent = await prisma.awardEventRoom.findFirst({
          select: { id: true },
          where: {
            postId: id,
            visibility: "PARTICIPANTS",
            event: {
              rooms: {
                some: {
                  writerId: session.user.id
                }
              }
            }
          }
        })
        isParticipantViewer = Boolean(sharedInEvent)
      }

      if (!isParticipantViewer) {
        return Response.json({ error: "Post not found" }, { status: 404 })
      }
    }

    const { authorId, ...safePost } = post
    void authorId

    return Response.json({ data: safePost })
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error)
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
    const data = updateSchema.parse(await request.json())
    const sizeError = validatePostContentSize(data)
    if (sizeError) {
      return Response.json({ error: sizeError }, { status: 413 })
    }
    const changesEditableState =
      data.categoryId !== undefined ||
      data.coAuthorIds !== undefined ||
      data.content !== undefined ||
      data.contentText !== undefined ||
      data.coverAlt !== undefined ||
      data.coverUrl !== undefined ||
      data.draftVisibility !== undefined ||
      data.excerpt !== undefined ||
      data.tagIds !== undefined ||
      data.title !== undefined
    if (changesEditableState && data.baseVersion === undefined) {
      return Response.json(
        { error: "Post version is required before saving editable content" },
        { status: 428 },
      )
    }
    let shouldRevalidatePosts = false
    let existingSlug: string | null = null

    const post = await prisma.$transaction(async (tx) => {
      const existing = await tx.post.findUnique({
        select: {
          authorId: true,
          categoryId: true,
          content: true,
          moderationLockedAt: true,
          publishedAt: true,
          removedAt: true,
          removedFromStatus: true,
          status: true,
          id: true,
          slug: true,
          title: true,
          contentText: true,
          coverAlt: true,
          coverUrl: true,
          draftVisibility: true,
          excerpt: true,
          excerptContent: true,
          version: true,
          coAuthors: { select: { userId: true, status: true } },
          tags: { select: { tagId: true } },
        },
        where: { id },
      })

      if (!existing) {
        throw new RouteError("Post not found", 404)
      }

      if (
        data.baseVersion !== undefined &&
        data.baseVersion !== existing.version
      ) {
        throw new RouteError(
          "Post changed in another session. Your local copy was preserved.",
          409,
        )
      }

      if (
        !canManagePost({
          authorId: existing.authorId,
          coAuthors: existing.coAuthors,
          user: activeSession.user,
        })
      ) {
        throw new RouteError("Forbidden", 403)
      }

      const canUseOwnerActions = canPerformOwnerAction({
        authorId: existing.authorId,
        user: activeSession.user,
      })

      if (
        existing.status === "ARCHIVED" &&
        activeSession.user.role !== "ADMIN"
      ) {
        throw new RouteError("Forbidden", 403)
      }

      if (
        existing.status === "REMOVED" &&
        activeSession.user.role !== "ADMIN"
      ) {
        throw new RouteError("Forbidden", 403)
      }

      if (
        data.status === "PUBLISHED" &&
        existing.moderationLockedAt &&
        activeSession.user.role !== "ADMIN"
      ) {
        if (activeSession.user.id !== existing.authorId) {
          throw new RouteError("Forbidden", 403)
        }

        const reviewContext =
          data.reviewContext === "AWARD_EVENT_ROOM" && data.eventId && data.eventRoomId
            ? "AWARD_EVENT_ROOM"
            : "NORMAL_POST"
        await createPostReviewRequestWithClient(tx, {
          context: reviewContext,
          eventId: reviewContext === "AWARD_EVENT_ROOM" ? data.eventId : null,
          eventRoomId:
            reviewContext === "AWARD_EVENT_ROOM" ? data.eventRoomId : null,
          postId: existing.id,
          requestedPostVersion: existing.version,
          requesterId: activeSession.user.id,
          snapshot: {
            authorId: existing.authorId,
            categoryId:
              data.categoryId !== undefined ? data.categoryId : existing.categoryId,
            coAuthorIds:
              data.coAuthorIds ??
              (existing.coAuthors ?? []).map(({ userId }) => userId),
            content: (data.content ?? existing.content) as Prisma.JsonValue,
            contentText:
              data.contentText !== undefined
                ? data.contentText.trim() || null
                : existing.contentText,
            coverAlt:
              data.coverAlt !== undefined
                ? data.coverAlt.trim() || null
                : existing.coverAlt,
            coverUrl:
              data.coverUrl !== undefined ? data.coverUrl : existing.coverUrl,
            draftVisibility: data.draftVisibility ?? existing.draftVisibility,
            excerpt:
              data.excerpt !== undefined ? data.excerpt || null : existing.excerpt,
            excerptContent:
              data.excerptContent !== undefined
                ? (data.excerptContent as Prisma.JsonValue | null)
                : (existing.excerptContent as Prisma.JsonValue | null),
            publishedAt: existing.publishedAt?.toISOString() ?? null,
            removedAt: existing.removedAt?.toISOString() ?? null,
            removedFromStatus: existing.removedFromStatus,
            slug: existing.slug,
            status: "PUBLISHED",
            tagIds: data.tagIds ?? (existing.tags ?? []).map(({ tagId }) => tagId),
            title: data.title ?? existing.title,
            version: existing.version,
          },
        })

        return {
          id: existing.id,
          lastSavedAt: null,
          reviewRequested: true,
          slug: existing.slug,
          status: existing.status,
          updatedAt: new Date(),
          version: existing.version,
        }
      }

      if (
        data.status === "PUBLISHED" &&
        activeSession.user.id !== existing.authorId
      ) {
        throw new RouteError("Forbidden", 403)
      }

      if (data.status === "ARCHIVED" && !canUseOwnerActions) {
        throw new RouteError("Forbidden", 403)
      }

      if (
        data.status === "DRAFT" &&
        existing.status === "PUBLISHED" &&
        !canUseOwnerActions
      ) {
        throw new RouteError("Forbidden", 403)
      }

      const nextStatus = data.status ?? existing.status
      if (nextStatus === "PUBLISHED") {
        const contentTextToCheck = data.contentText !== undefined ? data.contentText : existing.contentText
        if (!contentTextToCheck || !contentTextToCheck.trim()) {
          throw new RouteError("Nội dung bài viết không được để trống khi đăng.", 400)
        }
      }
      existingSlug = existing.slug
      shouldRevalidatePosts =
        existing.status === "PUBLISHED" ||
        nextStatus === "PUBLISHED" ||
        data.status === "ARCHIVED"

      let publishedAt: Date | null | undefined
      if (data.status === "PUBLISHED" && existing.status === "DRAFT") {
        publishedAt = new Date()
      } else if (data.status === "ARCHIVED") {
        publishedAt = null
      } else if (
        data.status === "DRAFT" &&
        (existing.status === "PUBLISHED" || existing.status === "ARCHIVED")
      ) {
        publishedAt = null
      }
      const shouldUpdateLastSavedAt =
        data.content !== undefined ||
        data.contentText !== undefined ||
        data.excerpt !== undefined ||
        data.excerptContent !== undefined ||
        data.title !== undefined

      let newSlug: string | undefined
      if (data.title && data.title !== existing.title) {
        const baseSlug = generateSlug(data.title) || "post"
        newSlug = await ensureUniqueSlug(baseSlug, tx, existing.id)
      }

      if (data.coAuthorIds) {
        const uniqueAuthorIds = uniqueIds(data.coAuthorIds)
        const existingCoAuthors = await tx.postAuthor.findMany({
          where: { postId: existing.id },
        })

        const toDelete = existingCoAuthors.filter(
          (ca) => !uniqueAuthorIds.includes(ca.userId)
        )
        if (toDelete.length > 0) {
          await tx.postAuthor.deleteMany({
            where: {
              postId: existing.id,
              userId: { in: toDelete.map((c) => c.userId) },
            },
          })
        }

        for (let i = 0; i < uniqueAuthorIds.length; i++) {
          const userId = uniqueAuthorIds[i]
          const isExisting = existingCoAuthors.find(ca => ca.userId === userId)
          if (isExisting) {
            await tx.postAuthor.update({
              where: { postId_userId: { postId: existing.id, userId } },
              data: { order: i },
            })
          } else {
            await tx.postAuthor.create({
              data: {
                postId: existing.id,
                userId,
                order: i,
                status: "PENDING",
              },
            })
          }
        }
      }

      if (data.tagIds) {
        const uniqueTags = uniqueIds(data.tagIds)
        const existingTags = await tx.postTag.findMany({
          where: { postId: existing.id },
        })

        const toDelete = existingTags.filter(
          (t) => !uniqueTags.includes(t.tagId)
        )
        if (toDelete.length > 0) {
          await tx.postTag.deleteMany({
            where: {
              postId: existing.id,
              tagId: { in: toDelete.map((t) => t.tagId) },
            },
          })
        }

        const tagsToCreate = uniqueTags.filter(
          (tagId) => !existingTags.find((t) => t.tagId === tagId)
        )
        if (tagsToCreate.length > 0) {
          await tx.postTag.createMany({
            data: tagsToCreate.map((tagId) => ({
              postId: existing.id,
              tagId,
            })),
          })
        }
      }

      const updated = await tx.post.update({
        data: {
          ...(data.categoryId !== undefined && {
            category: data.categoryId
              ? { connect: { id: data.categoryId } }
              : { disconnect: true },
          }),
          ...(data.content !== undefined && {
            content: data.content as Prisma.InputJsonObject,
          }),
          ...(data.contentText !== undefined && {
            contentText: data.contentText.trim() || null,
          }),
          ...(data.coverAlt !== undefined && {
            coverAlt: data.coverAlt.trim() || null,
          }),
          ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
          ...(data.draftVisibility !== undefined && {
            draftVisibility: data.draftVisibility,
          }),
          ...(data.excerpt !== undefined && { excerpt: data.excerpt || null }),
          ...(data.excerptContent !== undefined && {
            excerptContent:
              data.excerptContent === null
                ? Prisma.JsonNull
                : (data.excerptContent as Prisma.InputJsonObject),
          }),
          ...(data.status && nextStatus !== "PUBLISHED" && { featuredAt: null }),
          ...(shouldUpdateLastSavedAt && { lastSavedAt: new Date() }),
          ...(publishedAt !== undefined && { publishedAt }),
          ...(data.status && { status: data.status }),
          ...(data.title && { title: data.title }),
          ...(newSlug && { slug: newSlug }),
          version: { increment: 1 },
        },
        select: {
          id: true,
          lastSavedAt: true,
          slug: true,
          status: true,
          updatedAt: true,
          version: true,
        },
        where:
          data.baseVersion === undefined
            ? { id }
            : { id, version: data.baseVersion },
      })

      if (data.saveKind === "MANUAL" || data.status === "PUBLISHED") {
        const nextStatus = data.status ?? existing.status
        const snapshot: PostRecoverySnapshot = {
          authorId: existing.authorId,
          categoryId:
            data.categoryId !== undefined ? data.categoryId : existing.categoryId,
          coAuthorIds:
            data.coAuthorIds ??
            (existing.coAuthors ?? []).map(({ userId }) => userId),
          content: (data.content ?? existing.content) as Prisma.JsonValue,
          contentText:
            data.contentText !== undefined
              ? data.contentText.trim() || null
              : existing.contentText,
          coverAlt:
            data.coverAlt !== undefined
              ? data.coverAlt.trim() || null
              : existing.coverAlt,
          coverUrl:
            data.coverUrl !== undefined ? data.coverUrl : existing.coverUrl,
          draftVisibility: data.draftVisibility ?? existing.draftVisibility,
          excerpt:
            data.excerpt !== undefined ? data.excerpt || null : existing.excerpt,
          excerptContent:
            data.excerptContent !== undefined
              ? (data.excerptContent as Prisma.JsonValue | null)
              : (existing.excerptContent as Prisma.JsonValue | null),
          publishedAt:
            publishedAt !== undefined
              ? publishedAt?.toISOString() ?? null
              : existing.publishedAt?.toISOString() ?? null,
          removedAt: existing.removedAt?.toISOString() ?? null,
          removedFromStatus: existing.removedFromStatus,
          slug: newSlug ?? existing.slug,
          status: nextStatus,
          tagIds: data.tagIds ?? (existing.tags ?? []).map(({ tagId }) => tagId),
          title: data.title ?? existing.title,
          version: updated.version,
        }
        const kind = data.status === "PUBLISHED" ? "PUBLISH" : "MANUAL_SAVE"

        await tx.postRevision.create({
          data: {
            actorId: activeSession.user.id,
            checksum: getPostSnapshotChecksum(snapshot),
            kind,
            postId: existing.id,
            snapshot: snapshot as unknown as Prisma.InputJsonObject,
            sourceVersion: updated.version,
          },
          select: { id: true },
        })
        await tx.postAuditEvent.create({
          data: {
            action: "SAVE",
            actorId: activeSession.user.id,
            metadata: { kind },
            postId: existing.id,
            sourceVersion: updated.version,
          },
          select: { id: true },
        })
      }

      return updated
    })

    if (shouldRevalidatePosts) {
      revalidatePostMutationPaths([existingSlug, post.slug])
    }

    return Response.json({ data: post })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof PostReviewRequestError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { error: "Post changed in another session. Your local copy was preserved." },
        { status: 409 },
      )
    }

    console.error("[PATCH /api/posts/[id]]", error)
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
    const parsed = permanentDeleteSchema.safeParse(
      await request.json().catch(() => null),
    )

    if (!parsed.success) {
      throw new RouteError("Type the post title to confirm deletion", 400)
    }

    const existing = await prisma.post.findUnique({
      select: {
        content: true,
        coverUrl: true,
        id: true,
        removedAt: true,
        slug: true,
        status: true,
        title: true,
      },
      where: { id },
    })

    if (!existing) {
      throw new RouteError("Post not found", 404)
    }

    if (existing.status !== "REMOVED") {
      throw new RouteError("Remove the post before permanently deleting it", 409)
    }

    if (
      !existing.removedAt ||
      Date.now() - existing.removedAt.getTime() < HARD_DELETE_RETENTION_MS
    ) {
      throw new RouteError(
        "Removed posts must remain recoverable for 90 days",
        409,
      )
    }

    if (
      process.env.NODE_ENV !== "test" &&
      process.env.POST_HARD_DELETE_ENABLED !== "true"
    ) {
      throw new RouteError("Permanent post deletion is not enabled", 503)
    }

    const durability = await prisma.durabilityStatus.findUnique({
      select: { latestBackupAt: true, severity: true },
      where: { id: "primary" },
    })
    if (
      !durability ||
      durability.severity !== "HEALTHY" ||
      !durability.latestBackupAt ||
      durability.latestBackupAt <= existing.removedAt
    ) {
      throw new RouteError(
        "A verified backup created after removal is required",
        409,
      )
    }

    if (parsed.data.confirmation !== existing.title) {
      throw new RouteError("Post title does not match", 400)
    }

    const mediaUrls = getPostMediaUrls(existing)
    const otherPosts =
      mediaUrls.size > 0
        ? await prisma.post.findMany({
            select: { content: true, coverUrl: true },
            where: { id: { not: id } },
          })
        : []
    const sharedMediaUrls = new Set(
      otherPosts.flatMap((post) => Array.from(getPostMediaUrls(post))),
    )
    const ownedMediaUrls = Array.from(mediaUrls).filter(
      (url) => !sharedMediaUrls.has(url),
    )

    await prisma.$transaction(async (tx) => {
      await tx.postAuditEvent.create({
        data: {
          action: "PURGE",
          actorId: activeSession.user.id,
          metadata: { slug: existing.slug, title: existing.title },
          postId: existing.id,
        },
        select: { id: true },
      })
      if (ownedMediaUrls.length > 0) {
        await tx.mediaCleanupJob.create({
          data: { objectKeys: ownedMediaUrls },
          select: { id: true },
        })
      }
      await tx.awardEvent.updateMany({
        data: { finalPostId: null },
        where: { finalPostId: id },
      })
      await tx.awardEventRoom.updateMany({
        data: { postId: null },
        where: { postId: id },
      })
      await tx.notification.deleteMany({
        where: { data: { equals: id, path: ["postId"] } },
      })
      await tx.analyticsEvent.deleteMany({
        where: { postSlug: existing.slug },
      })
      await tx.analyticsDailyPage.deleteMany({
        where: { postSlug: existing.slug },
      })
      await tx.post.delete({
        select: { id: true },
        where: { id },
      })
      await tx.postRevision.deleteMany({ where: { postId: id } })
    })

    revalidatePostMutationPaths([existing.slug])

    return Response.json({ data: { message: "Post permanently deleted" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/posts/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
