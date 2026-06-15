import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
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

    revalidateTag("posts", "max")

    return Response.json({ data: postAuthor }, { status: 200 })
  } catch (error) {
    console.error("[POST /api/posts/[id]/co-authors/accept]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
