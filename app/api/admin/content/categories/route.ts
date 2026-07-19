import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const categorySelect = {
  _count: { select: { posts: true } },
  description: true,
  id: true,
  name: true,
  slug: true,
} as const

const categorySchema = z.object({
  description: z.string().trim().max(500).optional(),
  name: z.string().trim().min(1).max(80),
})

async function requireAdmin() {
  return getActiveSession(["ADMIN"])
}

export async function GET() {
  const activeSession = await requireAdmin()

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: categorySelect,
    })

    return Response.json({ data: categories })
  } catch (error) {
    console.error("[GET /api/admin/content/categories]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const activeSession = await requireAdmin()

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = categorySchema.parse(await request.json())
    const slug = generateSlug(data.name) || "category"
    const category = await prisma.category.create({
      data: {
        description: data.description || null,
        name: data.name,
        slug,
      },
      select: categorySelect,
    })

    revalidateTag("categories", "max")
    revalidateTag("posts", "max")

    return Response.json({ data: category }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid category" }, { status: 400 })
    }

    console.error("[POST /api/admin/content/categories]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
