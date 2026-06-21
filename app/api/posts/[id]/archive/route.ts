import { getActiveSession } from "@/lib/authz"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function requireAdmin() {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    throw new RouteError("Unauthorized", 401)
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const post = await prisma.post.findUnique({
      select: { id: true, slug: true, status: true },
      where: { id },
    })

    if (!post) {
      throw new RouteError("Post not found", 404)
    }

    if (post.status === "ARCHIVED") {
      throw new RouteError("Post is already archived", 400)
    }

    const updatedPost = await prisma.post.update({
      data: { status: "ARCHIVED" },
      select: { id: true, slug: true, status: true },
      where: { id },
    })
    revalidatePostMutationPaths([post.slug, updatedPost.slug])

    return Response.json({ data: { message: "Post archived" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[POST /api/posts/[id]/archive]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const post = await prisma.post.findUnique({
      select: { id: true, slug: true, status: true },
      where: { id },
    })

    if (!post) {
      throw new RouteError("Post not found", 404)
    }

    if (post.status !== "ARCHIVED") {
      throw new RouteError("Post is not archived", 400)
    }

    const updatedPost = await prisma.post.update({
      data: { status: "DRAFT" },
      select: { id: true, slug: true, status: true },
      where: { id },
    })
    revalidatePostMutationPaths([post.slug, updatedPost.slug])

    return Response.json({ data: { message: "Post restored to draft" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/posts/[id]/archive]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
