import { ZodError, z } from "zod"
import { after } from "next/server"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  enqueueNewsletterBroadcast,
  processNewsletterQueue,
} from "@/lib/newsletterQueue"
import { prisma } from "@/lib/prisma"

const broadcastSchema = z
  .object({
    customBody: z.string().trim().max(5000).optional(),
    postId: z.string().trim().min(1).optional(),
    previewText: z.string().trim().max(200).optional(),
    subject: z.string().trim().min(1).max(200),
  })
  .refine((data) => Boolean(data.postId || data.customBody), {
    message: "Either postId or customBody must be provided",
  })

interface FeaturedPost {
  coverUrl: string | null
  excerpt: string | null
  slug: string
  title: string
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = broadcastSchema.parse(await request.json())
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured")
    }

    let featuredPost: FeaturedPost | null = null

    if (data.postId) {
      featuredPost = await prisma.post.findUnique({
        select: { coverUrl: true, excerpt: true, slug: true, title: true },
        where: { id: data.postId, status: "PUBLISHED" },
      })

      if (!featuredPost) {
        return Response.json(
          { error: "Post not found or not published" },
          { status: 404 },
        )
      }
    }

    const queued = await enqueueNewsletterBroadcast({
      appUrl,
      customBody: data.customBody,
      featuredPost: featuredPost
        ? {
            coverUrl: featuredPost.coverUrl,
            excerpt: featuredPost.excerpt,
            title: featuredPost.title,
            url: `${appUrl}/${featuredPost.slug}`,
          }
        : null,
      previewText: data.previewText,
      subject: data.subject,
    })

    after(async () => {
      try {
        await processNewsletterQueue()
      } catch (error) {
        console.error("[NEWSLETTER_QUEUE_IMMEDIATE]", error)
      }
    })

    return Response.json({ data: queued }, { status: 202 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/newsletter/broadcast]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
