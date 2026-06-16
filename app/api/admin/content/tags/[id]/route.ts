import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const tagSelect = {
  _count: { select: { posts: true } },
  id: true,
  name: true,
  slug: true,
} as const

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50),
})

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function requireAdmin() {
  return getActiveSession(["ADMIN"])
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await requireAdmin()

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const { name } = updateSchema.parse(await request.json())
    const tag = await prisma.tag.update({
      data: { name, slug: generateSlug(name) || "tag" },
      select: tagSelect,
      where: { id },
    })

    revalidateTag("posts", "max")

    return Response.json({ data: tag })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid tag" }, { status: 400 })
    }

    console.error("[PATCH /api/admin/content/tags/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await requireAdmin()

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    await prisma.$transaction(async (tx) => {
      const tag = await tx.tag.findUnique({
        select: {
          _count: { select: { posts: true } },
          id: true,
          name: true,
        },
        where: { id },
      })

      if (!tag) {
        throw new RouteError("Tag not found", 404)
      }

      await tx.postTag.deleteMany({ where: { tagId: id } })
      await tx.tag.delete({
        select: { id: true },
        where: { id },
      })
    })

    revalidateTag("posts", "max")

    return Response.json({ data: { message: "Tag deleted" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/admin/content/tags/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
