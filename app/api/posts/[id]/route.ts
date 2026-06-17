import type { Prisma, Role } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { canViewPost } from "@/lib/postAccess"
import { prisma } from "@/lib/prisma"
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
  categoryId: z.string().min(1).nullable().optional(),
  coAuthorIds: z.array(z.string().min(1)).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  contentText: z.string().optional(),
  coverAlt: z.string().max(200).optional(),
  coverUrl: z.string().url().nullable().optional(),
  draftVisibility: z.enum(["PRIVATE", "CO_AUTHORS"]).optional(),
  excerpt: z.string().trim().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  title: z.string().trim().min(1).max(200).optional(),
})

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

    const post = await prisma.$transaction(async (tx) => {
      const existing = await tx.post.findUnique({
        select: {
          authorId: true,
          status: true,
          id: true,
          title: true,
          coAuthors: { select: { userId: true, status: true } },
        },
        where: { id },
      })

      if (!existing) {
        throw new RouteError("Post not found", 404)
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

      return tx.post.update({
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
          ...(shouldUpdateLastSavedAt && { lastSavedAt: new Date() }),
          ...(publishedAt !== undefined && { publishedAt }),
          ...(data.status && { status: data.status }),
          ...(data.tagIds && {
            tags: {
              create: uniqueIds(data.tagIds).map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
              deleteMany: {},
            },
          }),
          ...(data.title && { title: data.title }),
          ...(newSlug && { slug: newSlug }),
        },
        select: {
          id: true,
          lastSavedAt: true,
          slug: true,
          status: true,
          updatedAt: true,
        },
        where: { id },
      })
    })

    revalidateTag("posts", "max")

    return Response.json({ data: post })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[PATCH /api/posts/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    await prisma.$transaction(async (tx) => {
      const existing = await tx.post.findUnique({
        select: {
          authorId: true,
          coAuthors: { select: { userId: true, status: true } },
        },
        where: { id },
      })

      if (!existing) {
        throw new RouteError("Post not found", 404)
      }

      if (!canPerformOwnerAction({
        authorId: existing.authorId,
        user: activeSession.user,
      })) {
        throw new RouteError("Forbidden", 403)
      }

      await tx.post.delete({
        select: { id: true },
        where: { id },
      })
    })

    revalidateTag("posts", "max")

    return Response.json({ data: { message: "Post deleted" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/posts/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
