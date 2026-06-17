import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const querySchema = z.object({
  q: z.string().trim().max(50).default(""),
})

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { q } = querySchema.parse(Object.fromEntries(searchParams))

    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 20,
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    })

    return Response.json({ data: tags })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[GET /api/tags]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { name } = createSchema.parse(await request.json())
    const slug = generateSlug(name) || "tag"
    const tag = await prisma.tag.upsert({
      create: { name, slug },
      select: { id: true, name: true, slug: true },
      update: {},
      where: { slug },
    })

    revalidateTag("tags", "max")
    revalidateTag("posts", "max")

    return Response.json({ data: tag }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid tag name" }, { status: 400 })
    }

    console.error("[POST /api/tags]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
