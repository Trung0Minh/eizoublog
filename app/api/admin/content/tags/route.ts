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

const tagSchema = z.object({
  name: z.string().trim().min(1).max(50),
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
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: tagSelect,
    })

    return Response.json({ data: tags })
  } catch (error) {
    console.error("[GET /api/admin/content/tags]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const activeSession = await requireAdmin()

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { name } = tagSchema.parse(await request.json())
    const tag = await prisma.tag.create({
      data: { name, slug: generateSlug(name) || "tag" },
      select: tagSelect,
    })

    revalidateTag("tags", "max")
    revalidateTag("posts", "max")

    return Response.json({ data: tag }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid tag" }, { status: 400 })
    }

    console.error("[POST /api/admin/content/tags]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
