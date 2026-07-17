import { runDurabilityCheck } from "@/lib/durability"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    return Response.json({ data: await runDurabilityCheck() })
  } catch (error) {
    console.error({ event: "durability_check_failed", error })
    return Response.json({ error: "Durability check failed" }, { status: 500 })
  }
}
