import type { DurabilitySeverity, Prisma } from "@prisma/client"

import { processMediaCleanupJobs } from "@/lib/mediaCleanup"
import { prisma } from "@/lib/prisma"
import { getBackupManifest } from "@/lib/r2"
import { sendDurabilityAlertEmail } from "@/lib/resend"

const BACKUP_STALE_MS = 8 * 60 * 60 * 1000

interface DurabilityIssue {
  code: string
  message: string
}

export async function runDurabilityCheck() {
  const previous = await prisma.durabilityStatus.findUnique({
    select: { severity: true },
    where: { id: "primary" },
  })
  const capacityRaw = process.env.DATABASE_CAPACITY_BYTES
  const parsedCapacity = capacityRaw && /^\d+$/.test(capacityRaw) ? BigInt(capacityRaw) : null
  const capacityBytes = parsedCapacity && parsedCapacity > BigInt(0) ? parsedCapacity : null
  const sizeRows = await prisma.$queryRaw<Array<{ bytes: bigint }>>`
    SELECT pg_database_size(current_database())::bigint AS bytes
  `
  const databaseBytes = sizeRows[0]?.bytes ?? null
  const issues: DurabilityIssue[] = []
  let severity: DurabilitySeverity = "HEALTHY"

  if (!capacityBytes || !databaseBytes) {
    severity = "UNKNOWN"
    issues.push({ code: "CAPACITY_UNKNOWN", message: "Database capacity is not configured" })
  } else {
    const utilization = Number((databaseBytes * BigInt(10_000)) / capacityBytes) / 100
    if (utilization >= 85) {
      severity = "CRITICAL"
      issues.push({ code: "DATABASE_CAPACITY_CRITICAL", message: `Database storage is ${utilization.toFixed(1)}% full` })
    } else if (utilization >= 70) {
      severity = "WARNING"
      issues.push({ code: "DATABASE_CAPACITY_WARNING", message: `Database storage is ${utilization.toFixed(1)}% full` })
    }
  }

  let latestBackupAt: Date | null = null
  let latestMediaBackupAt: Date | null = null
  try {
    const manifest = await getBackupManifest()
    if (!manifest || manifest.status !== "healthy") {
      if (severity === "HEALTHY") severity = "UNKNOWN"
      issues.push({ code: "BACKUP_UNKNOWN", message: "No verified backup manifest is available" })
    } else {
      const backupDate = new Date(manifest.backupAt)
      const mediaBackupDate = new Date(manifest.mediaBackupAt)
      latestBackupAt = Number.isFinite(backupDate.getTime()) ? backupDate : null
      latestMediaBackupAt = Number.isFinite(mediaBackupDate.getTime())
        ? mediaBackupDate
        : null
      if (!latestBackupAt || Date.now() - latestBackupAt.getTime() > BACKUP_STALE_MS) {
        if (severity !== "CRITICAL") severity = "WARNING"
        issues.push({ code: "BACKUP_STALE", message: "The latest database backup is stale" })
      }
      if (
        !latestMediaBackupAt ||
        Date.now() - latestMediaBackupAt.getTime() > BACKUP_STALE_MS
      ) {
        if (severity !== "CRITICAL") severity = "WARNING"
        issues.push({ code: "MEDIA_BACKUP_STALE", message: "The latest media backup is stale" })
      }
    }
  } catch (error) {
    if (severity === "HEALTHY") severity = "UNKNOWN"
    issues.push({ code: "BACKUP_CHECK_FAILED", message: "Backup verification failed" })
    console.error({ event: "durability_backup_check_failed", error })
  }

  const status = await prisma.durabilityStatus.upsert({
    create: {
      capacityBytes,
      checkedAt: new Date(),
      databaseBytes,
      id: "primary",
      issues: issues as unknown as Prisma.InputJsonArray,
      latestBackupAt,
      latestMediaBackupAt,
      severity,
    },
    select: { checkedAt: true, severity: true },
    update: {
      capacityBytes,
      checkedAt: new Date(),
      databaseBytes,
      issues: issues as unknown as Prisma.InputJsonArray,
      latestBackupAt,
      latestMediaBackupAt,
      severity,
    },
    where: { id: "primary" },
  })

  if (previous?.severity !== severity && severity !== "HEALTHY") {
    const admins = await prisma.user.findMany({
      select: { id: true },
      where: { role: "ADMIN" },
    })
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(({ id }) => ({
          data: { issues, severity } as unknown as Prisma.InputJsonObject,
          type: "DURABILITY_ALERT" as const,
          userId: id,
        })),
      })
    }
    const recipients = (process.env.DURABILITY_ALERT_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
    try {
      await sendDurabilityAlertEmail({
        issues: issues.map(({ message }) => message),
        severity,
        to: recipients,
      })
    } catch (error) {
      console.error({ event: "durability_alert_email_failed", error })
    }
  }

  const [revisionCleanup, mediaCleanup] = await Promise.all([
    prisma.postRevision.deleteMany({
      where: { expiresAt: { lte: new Date() }, kind: "AUTO_CHECKPOINT" },
    }),
    processMediaCleanupJobs(),
  ])

  console.info({
    event: "durability_check_completed",
    severity,
    revisionCleanupCount: revisionCleanup.count,
    mediaCleanup,
  })
  return { checkedAt: status.checkedAt, issues, severity }
}
