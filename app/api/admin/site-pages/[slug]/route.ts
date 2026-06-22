import { revalidatePath } from "next/cache"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const editablePageSlugs = new Set(["about", "resources", "nhap-mon-sakuga"])

const updateSitePageSchema = z.object({
  content: z.unknown(),
  contentText: z.string().optional().nullable(),
})

function normalizeJson(value: unknown) {
  if (value === undefined) {
    throw new Error("Content is required")
  }

  return JSON.parse(JSON.stringify(value)) as object
}

function titleForSlug(slug: string) {
  if (slug === "nhap-mon-sakuga") {
    return "Nhập môn Sakuga"
  }
  return slug === "about" ? "About" : "Resources"
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { slug } = await params

    if (!editablePageSlugs.has(slug)) {
      return Response.json({ error: "Page not found" }, { status: 404 })
    }

    const data = updateSitePageSchema.parse(await request.json())
    const content = normalizeJson(data.content)

    const page = await prisma.sitePage.upsert({
      create: {
        content,
        contentText: data.contentText ?? null,
        slug,
        title: titleForSlug(slug),
      },
      update: {
        content,
        contentText: data.contentText ?? null,
      },
      where: { slug },
    })

    revalidatePath(`/${slug}`)

    return Response.json({
      data: {
        content: page.content,
        contentText: page.contentText,
        slug: page.slug,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[PATCH /api/admin/site-pages/[slug]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
