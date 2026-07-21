import { revalidatePath, revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    if (!existing || existing.status !== "ACCEPTED") {
      return Response.json({ error: "Co-author access not found" }, { status: 404 })
    }

    if (existing.post.authorId === activeSession.user.id) {
      return Response.json({ error: "Primary author cannot withdraw co-author access" }, { status: 400 })
    }

    await prisma.postAuthor.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: activeSession.user.id,
        },
      },
    })

    revalidateTag("posts", "max")
    revalidatePath("/dashboard")

    return Response.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error("[POST /api/posts/[id]/co-authors/withdraw]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
