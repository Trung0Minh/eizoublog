import { processNewsletterQueue } from "@/lib/newsletterQueue"
import { processCommentEmailQueue } from "@/lib/commentEmailQueue"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [newsletter, comments] = await Promise.allSettled([
      processNewsletterQueue(),
      processCommentEmailQueue(),
    ])
    if (comments.status === "rejected") {
      console.error("[GET /api/cron/newsletter] Comment notification recovery failed", comments.reason)
    }
    if (newsletter.status === "rejected") throw newsletter.reason
    if (comments.status === "rejected") throw comments.reason
    const result = newsletter.value
    return Response.json({ data: result })
  } catch (error) {
    console.error("[GET /api/cron/newsletter]", error)
    return Response.json({ error: "Queue processing failed" }, { status: 500 })
  }
}
