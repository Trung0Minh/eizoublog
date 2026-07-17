import { z, ZodError } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const { limit, page } = querySchema.parse(Object.fromEntries(searchParams))
    const post = await prisma.post.findUnique({
      select: {
        authorId: true,
        coAuthors: { select: { status: true, userId: true } },
        id: true,
      },
      where: { id },
    })

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    const canInspect =
      activeSession.user.role === "ADMIN" ||
      post.authorId === activeSession.user.id ||
      post.coAuthors.some(
        ({ status, userId }) =>
          status === "ACCEPTED" && userId === activeSession.user.id,
      )
    if (!canInspect) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const [revisions, total] = await prisma.$transaction([
      prisma.postRevision.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          actorId: true,
          checksum: true,
          createdAt: true,
          id: true,
          kind: true,
          sourceVersion: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        where: { postId: id },
      }),
      prisma.postRevision.count({ where: { postId: id } }),
    ])

    return Response.json({ data: { limit, page, revisions, total } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }
    console.error("[GET /api/posts/[id]/revisions]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
