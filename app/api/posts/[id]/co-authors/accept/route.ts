import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { createCoAuthorResponseNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    const existing = await prisma.postAuthor.findUnique({
      select: {
        post: {
          select: {
            authorId: true,
            id: true,
            slug: true,
            title: true,
          },
        },
        status: true,
      },
      where: {
        postId_userId: {
          postId: id,
          userId: activeSession.user.id,
        },
      },
    })

    if (!existing) {
      return Response.json({ error: "Invitation not found" }, { status: 404 })
    }

    const postAuthor = await prisma.postAuthor.update({
      where: {
        postId_userId: {
          postId: id,
          userId: activeSession.user.id,
        },
      },
      data: {
        status: "ACCEPTED",
      },
    })

    if (
      existing.status !== "ACCEPTED" &&
      existing.post.authorId !== activeSession.user.id
    ) {
      await createCoAuthorResponseNotification({
        actorName: activeSession.user.name,
        actorUsername: activeSession.user.username,
        postAuthorId: existing.post.authorId,
        postId: existing.post.id,
        postSlug: existing.post.slug,
        postTitle: existing.post.title,
        type: "COAUTHOR_ACCEPTED",
      })
    }

    revalidateTag("posts", "max")

    return Response.json({ data: postAuthor }, { status: 200 })
  } catch (error) {
    console.error("[POST /api/posts/[id]/co-authors/accept]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
