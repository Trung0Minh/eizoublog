import { ZodError, z } from "zod"
import { after } from "next/server"

import {
  createSessionHash,
  createVisitorHash,
  recordAnalyticsEvent,
  shouldIgnoreAnalyticsPath,
} from "@/lib/internalAnalytics"

const eventSchema = z.object({
  data: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  eventName: z.enum([
    "comment_submitted",
    "newsletter_subscribed",
    "page_view",
    "post_read",
    "search",
  ]),
  path: z.string().max(2048).optional(),
  sessionId: z.string().max(200).optional(),
})

async function parseBody(request: Request) {
  const text = await request.text()
  return text ? JSON.parse(text) : {}
}

export async function POST(request: Request) {
  try {
    const data = eventSchema.parse(await parseBody(request))

    if (shouldIgnoreAnalyticsPath(data.path)) {
      return Response.json({ data: { tracked: false } }, { status: 202 })
    }

    const occurredAt = new Date()
    const visitorHash = createVisitorHash(request, occurredAt)
    const sessionHash = createSessionHash(
      data.sessionId,
      visitorHash,
      occurredAt,
    )
    after(async () => {
      await recordAnalyticsEvent({
        data: data.data,
        eventName: data.eventName,
        occurredAt,
        path: data.path,
        sessionHash,
        visitorHash,
      })
    })

    return Response.json({ data: { accepted: true } }, { status: 202 })
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/analytics/events]", error)
    return Response.json({ data: { tracked: false } }, { status: 202 })
  }
}
