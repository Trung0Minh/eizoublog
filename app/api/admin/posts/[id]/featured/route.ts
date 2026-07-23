import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"

const featuredSchema = z.object({
  featured: z.boolean(),
})

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const input = featuredSchema.parse(await request.json())
    const existing = await prisma.post.findUnique({
      select: {
        id: true,
        slug: true,
        status: true,
      },
      where: { id },
    })

    if (!existing) {
      throw new RouteError("Post not found", 404)
    }

    if (input.featured && existing.status !== "PUBLISHED") {
      throw new RouteError("Only published posts can be featured", 400)
    }

    const featuredAt = input.featured ? new Date() : null
    const post = await prisma.post.update({
      data: { featuredAt },
      select: {
        featuredAt: true,
        id: true,
        slug: true,
      },
      where: { id },
    })

    revalidatePostMutationPaths([post.slug])

    return Response.json({
      data: {
        featuredAt: post.featuredAt ? post.featuredAt.toISOString() : null,
        id: post.id,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[PATCH /api/admin/posts/[id]/featured]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
