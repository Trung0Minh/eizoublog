import { prisma } from "@/lib/prisma"
import { deleteR2Objects } from "@/lib/r2"

function readUrls(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

export async function processMediaCleanupJobs(limit = 10) {
  const jobs = await prisma.mediaCleanupJob.findMany({
    orderBy: { createdAt: "asc" },
    select: { attempts: true, id: true, objectKeys: true },
    take: limit,
    where: { nextAttemptAt: { lte: new Date() }, status: "PENDING" },
  })

  let completed = 0
  for (const job of jobs) {
    try {
      await deleteR2Objects(readUrls(job.objectKeys))
      await prisma.mediaCleanupJob.update({
        data: { attempts: { increment: 1 }, lastError: null, status: "COMPLETE" },
        select: { id: true },
        where: { id: job.id },
      })
      completed += 1
    } catch (error) {
      const attempts = job.attempts + 1
      const delayMinutes = Math.min(24 * 60, 2 ** Math.min(attempts, 10))
      await prisma.mediaCleanupJob.update({
        data: {
          attempts,
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown cleanup error",
          nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
          status: attempts >= 10 ? "FAILED" : "PENDING",
        },
        select: { id: true },
        where: { id: job.id },
      })
      console.error({ event: "post_media_cleanup_failed", jobId: job.id, attempts })
    }
  }

  return { completed, processed: jobs.length }
}
