import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const categorySelect = {
  _count: { select: { children: true, posts: true } },
  description: true,
  id: true,
  name: true,
  parentId: true,
  slug: true,
} as const

const updateSchema = z.object({
  description: z.string().trim().max(500).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  parentId: z.string().min(1).nullable().optional(),
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
    const data = updateSchema.parse(await request.json())
    const category = await prisma.category.update({
      data: {
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.name && {
          name: data.name,
          slug: generateSlug(data.name) || "category",
        }),
        ...(data.parentId !== undefined && {
          parent: data.parentId
            ? { connect: { id: data.parentId } }
            : { disconnect: true },
        }),
      },
      select: categorySelect,
      where: { id },
    })

    revalidateTag("categories", "max")
    revalidateTag("posts", "max")

    return Response.json({ data: category })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid category" }, { status: 400 })
    }

    console.error("[PATCH /api/admin/content/categories/[id]]", error)
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
      const category = await tx.category.findUnique({
        select: {
          _count: { select: { children: true, posts: true } },
          id: true,
          name: true,
        },
        where: { id },
      })

      if (!category) {
        throw new RouteError("Category not found", 404)
      }

      if (category._count.children > 0) {
        throw new RouteError("Move or delete child categories first", 400)
      }

      await tx.post.updateMany({
        data: { categoryId: null },
        where: { categoryId: id },
      })
      await tx.category.delete({
        select: { id: true },
        where: { id },
      })
    })

    revalidateTag("categories", "max")
    revalidateTag("posts", "max")

    return Response.json({ data: { message: "Category deleted" } })
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[DELETE /api/admin/content/categories/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
