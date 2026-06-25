import { processNewsletterQueue } from "@/lib/newsletterQueue"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processNewsletterQueue()
    return Response.json({ data: result })
  } catch (error) {
    console.error("[GET /api/cron/newsletter]", error)
    return Response.json({ error: "Queue processing failed" }, { status: 500 })
  }
}
