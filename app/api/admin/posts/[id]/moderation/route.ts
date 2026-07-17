import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  getPostModerationTransition,
  PostModerationTransitionError,
} from "@/lib/postModeration"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"

const moderationSchema = z.object({
  action: z.enum([
    "UNPUBLISH",
    "PUBLISH",
    "ARCHIVE",
    "RESTORE_ARCHIVED",
    "REMOVE",
    "RESTORE_REMOVED",
  ]),
  reason: z.string().trim().min(3).max(1000),
})

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const input = moderationSchema.parse(await request.json())
    const post = await prisma.post.findUnique({
      select: {
        authorId: true,
        contentText: true,
        id: true,
        moderationLockedAt: true,
        removedFromStatus: true,
        slug: true,
        status: true,
        title: true,
      },
      where: { id },
    })

    if (!post) {
      throw new RouteError("Post not found", 404)
    }

    if (input.action === "PUBLISH" && !post.contentText?.trim()) {
      throw new RouteError("Post content cannot be empty when publishing", 400)
    }

    const transition = getPostModerationTransition(input.action, post)
    const updatedPostPromise = prisma.post.update({
      data: {
        moderationLockedAt: transition.moderationLockedAt,
        publishedAt: transition.publishedAt,
        ...(transition.removedAt !== undefined && { removedAt: transition.removedAt }),
        removedFromStatus: transition.removedFromStatus,
        status: transition.toStatus,
      },
      select: { id: true, slug: true, status: true },
      where: { id },
    })
    const notificationPromise = prisma.notification.create({
      data: {
        data: {
          action: input.action,
          actorName: activeSession.user.name,
          fromStatus: post.status,
          postId: post.id,
          postSlug: post.slug,
          postTitle: post.title,
          reason: input.reason,
          toStatus: transition.toStatus,
        },
        type: "POST_MODERATION",
        userId: post.authorId,
      },
    })

    await prisma.$transaction([updatedPostPromise, notificationPromise])
    revalidatePostMutationPaths([post.slug])

    return Response.json({
      data: {
        message: "Post moderation updated",
        status: transition.toStatus,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof PostModerationTransitionError) {
      return Response.json({ error: error.message }, { status: 409 })
    }

    console.error("[POST /api/admin/posts/[id]/moderation]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
