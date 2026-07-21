import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      select: {
        author: { select: { id: true, name: true, username: true } },
        authorId: true,
        category: { select: { id: true, name: true, slug: true } },
        coAuthors: {
          orderBy: { order: "asc" },
          select: {
            status: true,
            user: { select: { id: true, name: true, username: true } },
            userId: true,
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
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        title: true,
        updatedAt: true,
        version: true,
      },
      where: { id },
    })
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    const canExport =
      activeSession.user.role === "ADMIN" ||
      post.authorId === activeSession.user.id ||
      post.coAuthors.some(
        ({ status, userId }) =>
          status === "ACCEPTED" && userId === activeSession.user.id,
      )
    if (!canExport) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const mediaUrls = new Set<string>()
    if (post.coverUrl) mediaUrls.add(post.coverUrl)
    const visit = (value: unknown) => {
      if (typeof value === "string") {
        if (/^https?:\/\//i.test(value)) mediaUrls.add(value)
      } else if (Array.isArray(value)) {
        value.forEach(visit)
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach(visit)
      }
    }
    visit(post.content)
    visit(post.excerptContent)
    const { authorId, ...safePost } = post
    void authorId

    return Response.json({
      data: {
        exportedAt: new Date().toISOString(),
        formatVersion: 1,
        media: Array.from(mediaUrls),
        post: safePost,
      },
    })
  } catch (error) {
    console.error("[GET /api/posts/[id]/export]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
