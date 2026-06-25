import type {
  NewsletterBroadcastStatus,
  NewsletterRecipientStatus,
} from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendNewsletterBroadcast } from "@/lib/resend"

const DEFAULT_BATCH_SIZE = 25
const DEFAULT_MAX_BATCHES = 10
const MAX_ATTEMPTS = 3
const CLAIM_TIMEOUT_MS = 15 * 60 * 1000
const MAX_ERROR_LENGTH = 1000

interface NewsletterFeaturedPost {
  coverUrl: string | null
  excerpt: string | null
  title: string
  url: string
}

interface EnqueueNewsletterBroadcastInput {
  appUrl: string
  customBody?: string
  featuredPost: NewsletterFeaturedPost | null
  previewText?: string
  subject: string
}

interface ClaimedRecipient {
  attempts: number
  broadcastId: string
  claimedAt: Date
  customBody: string | null
  email: string
  featuredCoverUrl: string | null
  featuredExcerpt: string | null
  featuredTitle: string | null
  featuredUrl: string | null
  id: string
  previewText: string | null
  subject: string
  unsubscribeUrl: string
}

interface ProcessNewsletterQueueOptions {
  batchSize?: number
  maxBatches?: number
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown delivery error"
  return message.slice(0, MAX_ERROR_LENGTH)
}

export async function enqueueNewsletterBroadcast(
  input: EnqueueNewsletterBroadcastInput,
) {
  return prisma.$transaction(async (tx) => {
    const subscribers = await tx.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "asc" },
      select: { email: true, id: true, token: true },
      where: { status: "ACTIVE" },
    })
    const baseUrl = input.appUrl.replace(/\/$/, "")
    const broadcast = await tx.newsletterBroadcast.create({
      data: {
        completedAt: subscribers.length === 0 ? new Date() : undefined,
        customBody: input.customBody,
        featuredCoverUrl: input.featuredPost?.coverUrl,
        featuredExcerpt: input.featuredPost?.excerpt,
        featuredTitle: input.featuredPost?.title,
        featuredUrl: input.featuredPost?.url,
        previewText: input.previewText,
        recipients: {
          create: subscribers.map((subscriber) => ({
            email: subscriber.email,
            subscriberId: subscriber.id,
            unsubscribeUrl: `${baseUrl}/unsubscribe?token=${subscriber.token}`,
          })),
        },
        status: subscribers.length === 0 ? "COMPLETED" : undefined,
        subject: input.subject,
        totalCount: subscribers.length,
      },
      select: { id: true },
    })

    return {
      broadcastId: broadcast.id,
      queued: subscribers.length,
      total: subscribers.length,
    }
  })
}

async function claimRecipients(batchSize: number) {
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS)

  return prisma.$queryRaw<ClaimedRecipient[]>`
    WITH candidates AS (
      SELECT recipient.id
      FROM newsletter_broadcast_recipients recipient
      WHERE (
          (
            recipient.status = 'PENDING'
            AND recipient.attempts < ${MAX_ATTEMPTS}
            AND recipient."nextAttemptAt" <= NOW()
          )
          OR (
            recipient.status = 'PROCESSING'
            AND recipient.attempts <= ${MAX_ATTEMPTS}
            AND recipient."claimedAt" < ${staleBefore}
          )
        )
      ORDER BY recipient."nextAttemptAt" ASC, recipient."createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${batchSize}
    ),
    claimed AS (
      UPDATE newsletter_broadcast_recipients recipient
      SET
        attempts = recipient.attempts
          + CASE WHEN recipient.status = 'PENDING' THEN 1 ELSE 0 END,
        status = 'PROCESSING',
        "claimedAt" = NOW(),
        "updatedAt" = NOW()
      FROM candidates
      WHERE recipient.id = candidates.id
      RETURNING recipient.*
    ),
    started AS (
      UPDATE newsletter_broadcasts broadcast
      SET
        status = 'PROCESSING',
        "startedAt" = COALESCE(broadcast."startedAt", NOW())
      WHERE broadcast.id IN (SELECT "broadcastId" FROM claimed)
      RETURNING broadcast.id
    )
    SELECT
      claimed.id,
      claimed."broadcastId",
      claimed.email,
      claimed."unsubscribeUrl",
      claimed.attempts,
      claimed."claimedAt",
      broadcast.subject,
      broadcast."previewText",
      broadcast."customBody",
      broadcast."featuredCoverUrl",
      broadcast."featuredExcerpt",
      broadcast."featuredTitle",
      broadcast."featuredUrl"
    FROM claimed
    JOIN started ON started.id = claimed."broadcastId"
    JOIN newsletter_broadcasts broadcast ON broadcast.id = claimed."broadcastId"
  `
}

async function reconcileBroadcast(broadcastId: string) {
  const groups = await prisma.newsletterBroadcastRecipient.groupBy({
    _count: { _all: true },
    by: ["status"],
    where: { broadcastId },
  })
  const counts = new Map<NewsletterRecipientStatus, number>(
    groups.map((group) => [group.status, group._count._all]),
  )
  const sentCount = counts.get("SENT") ?? 0
  const failedCount = counts.get("FAILED") ?? 0
  const pendingCount =
    (counts.get("PENDING") ?? 0) + (counts.get("PROCESSING") ?? 0)
  let status: NewsletterBroadcastStatus = "PROCESSING"

  if (pendingCount === 0) {
    if (failedCount === 0) {
      status = "COMPLETED"
    } else if (sentCount === 0) {
      status = "FAILED"
    } else {
      status = "PARTIAL"
    }
  }

  await prisma.newsletterBroadcast.update({
    data: {
      completedAt: pendingCount === 0 ? new Date() : null,
      failedCount,
      sentCount,
      status,
    },
    where: { id: broadcastId },
  })
}

async function processRecipient(recipient: ClaimedRecipient) {
  try {
    await sendNewsletterBroadcast({
      customBody: recipient.customBody ?? undefined,
      featuredPost: recipient.featuredTitle && recipient.featuredUrl
        ? {
            coverUrl: recipient.featuredCoverUrl,
            excerpt: recipient.featuredExcerpt,
            title: recipient.featuredTitle,
            url: recipient.featuredUrl,
          }
        : null,
      idempotencyKey: `newsletter-recipient-${recipient.id}`,
      previewText: recipient.previewText ?? undefined,
      subject: recipient.subject,
      to: recipient.email,
      unsubscribeUrl: recipient.unsubscribeUrl,
    })
    await prisma.newsletterBroadcastRecipient.updateMany({
      data: {
        claimedAt: null,
        lastError: null,
        sentAt: new Date(),
        status: "SENT",
      },
      where: {
        claimedAt: recipient.claimedAt,
        id: recipient.id,
        status: "PROCESSING",
      },
    })
    return true
  } catch (error) {
    const finalAttempt = recipient.attempts >= MAX_ATTEMPTS
    const retryDelayMs = recipient.attempts * 5 * 60 * 1000
    await prisma.newsletterBroadcastRecipient.updateMany({
      data: {
        claimedAt: null,
        lastError: getErrorMessage(error),
        nextAttemptAt: new Date(Date.now() + retryDelayMs),
        status: finalAttempt ? "FAILED" : "PENDING",
      },
      where: {
        claimedAt: recipient.claimedAt,
        id: recipient.id,
        status: "PROCESSING",
      },
    })
    return false
  }
}

export async function processNewsletterQueue(
  options: ProcessNewsletterQueueOptions = {},
) {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE
  const maxBatches = options.maxBatches ?? DEFAULT_MAX_BATCHES
  let claimed = 0
  let failed = 0
  let sent = 0

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const recipients = await claimRecipients(batchSize)
    if (recipients.length === 0) {
      break
    }

    claimed += recipients.length
    const results = await Promise.all(recipients.map(processRecipient))
    sent += results.filter(Boolean).length
    failed += results.filter((result) => !result).length

    const broadcastIds = [...new Set(recipients.map(({ broadcastId }) => broadcastId))]
    await Promise.all(broadcastIds.map(reconcileBroadcast))

    if (recipients.length < batchSize) {
      break
    }
  }

  return { claimed, failed, sent }
}
