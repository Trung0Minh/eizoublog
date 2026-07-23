import type { PostStatus } from "@prisma/client"
import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import {
  getPostModerationTransition,
  PostModerationTransitionError,
  type PostModerationAction,
} from "@/lib/postModeration"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"

const bulkModerationSchema = z.object({
  action: z.enum(["ARCHIVE", "REMOVE", "RESTORE"]),
  postIds: z.array(z.string().min(1)).min(1).max(100),
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

function resolveAction(
  action: z.infer<typeof bulkModerationSchema>["action"],
  status: PostStatus,
): PostModerationAction {
  if (action === "ARCHIVE") return "ARCHIVE"
  if (action === "REMOVE") return "REMOVE"
  if (status === "ARCHIVED") return "RESTORE_ARCHIVED"
  if (status === "REMOVED") return "RESTORE_REMOVED"

  throw new PostModerationTransitionError(
    "Action is not valid for the current post status",
  )
}

export async function POST(request: Request) {
  const activeSession = await auth()

  if (activeSession?.user?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const input = bulkModerationSchema.parse(await request.json())
    const postIds = Array.from(new Set(input.postIds))
    const result = await prisma.$transaction(async (tx) => {
      const posts = await tx.post.findMany({
        select: {
          authorId: true,
          contentText: true,
          id: true,
          removedFromStatus: true,
          slug: true,
          status: true,
          title: true,
        },
        where: { id: { in: postIds } },
      })

      if (posts.length !== postIds.length) {
        throw new RouteError("One or more posts were not found", 404)
      }

      const prepared = posts.map((post) => {
        const action = resolveAction(input.action, post.status)
        return {
          action,
          post,
          transition: getPostModerationTransition(action, post),
        }
      })

      await Promise.all(
        prepared.flatMap(({ action, post, transition }) => [
          tx.post.update({
            data: {
              featuredAt: transition.toStatus === "PUBLISHED" ? undefined : null,
              moderationLockedAt: transition.moderationLockedAt,
              publishedAt: transition.publishedAt,
              ...(transition.removedAt !== undefined && { removedAt: transition.removedAt }),
              removedFromStatus: transition.removedFromStatus,
              status: transition.toStatus,
            },
            select: { id: true },
            where: { id: post.id },
          }),
          tx.notification.create({
            data: {
              data: {
                action,
                actorName: activeSession.user.name ?? "Admin",
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
          }),
        ]),
      )

      return {
        posts: prepared.map(({ post, transition }) => ({
          id: post.id,
          status: transition.toStatus,
        })),
        slugs: prepared.map(({ post }) => post.slug),
      }
    })

    revalidatePostMutationPaths(result.slugs)
    return Response.json({ data: { posts: result.posts } })
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

    console.error("[POST /api/posts/bulk]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
