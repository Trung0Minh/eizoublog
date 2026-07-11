import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getPostDetailCacheTag } from "@/lib/cacheTags"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const comment = await prisma.comment.findUnique({
      select: {
        id: true,
        post: { select: { slug: true } },
      },
      where: { id },
    })

    if (!comment) {
      return Response.json({ error: "Comment not found" }, { status: 404 })
    }

    await prisma.comment.update({
      data: { status: "SPAM" },
      where: { id },
    })

    revalidateTag("comments", "max")
    revalidateTag(getPostDetailCacheTag(comment.post.slug), "max")

    return Response.json({ data: { message: "Comment hidden" } })
  } catch (error) {
    console.error("[DELETE /api/comments/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
