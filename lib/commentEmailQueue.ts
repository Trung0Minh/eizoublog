import type { CommentEmailDelivery } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendCommentReplyEmail, sendPostCommentEmail } from "@/lib/resend"

const MAX_ATTEMPTS = 3
const CLAIM_TIMEOUT_MS = 15 * 60 * 1000

type ClaimedDelivery = Pick<CommentEmailDelivery,
  "id" | "kind" | "to" | "toName" | "senderName" | "content" |
  "postTitle" | "postUrl" | "attempts" | "claimedAt"
>

export async function processCommentEmailQueue() {
  // Resend retains idempotency keys for 24 hours. Ambiguous older attempts
  // require manual review instead of risking a second notification.
  const expired = await prisma.commentEmailDelivery.updateMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      firstAttemptAt: { lt: new Date(Date.now() - 23 * 60 * 60 * 1000) },
    },
    data: { status: "FAILED", claimedAt: null },
  })
  if (expired.count > 0) {
    console.error("[comment email queue] Expired delivery attempts require review", expired.count)
  }
  const total = { claimed: 0, sent: 0, failed: 0 }
  for (let batch = 0; batch < 10; batch++) {
    const result = await processBatch()
    total.claimed += result.claimed
    total.sent += result.sent
    total.failed += result.failed
    if (result.claimed < 25) break
  }
  return total
}

async function processBatch() {
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS)
  const deliveries = await prisma.$queryRaw<ClaimedDelivery[]>`
    WITH candidates AS (
      SELECT id FROM comment_email_deliveries
      WHERE attempts < ${MAX_ATTEMPTS} AND (
        (status = 'PENDING' AND "nextAttemptAt" <= NOW())
        OR (status = 'PROCESSING' AND "claimedAt" < ${staleBefore})
      )
      ORDER BY "nextAttemptAt", "createdAt"
      FOR UPDATE SKIP LOCKED
      LIMIT 25
    )
    UPDATE comment_email_deliveries delivery
    SET status = 'PROCESSING', attempts = delivery.attempts + 1,
      "claimedAt" = NOW(), "firstAttemptAt" = COALESCE(delivery."firstAttemptAt", NOW())
    FROM candidates WHERE delivery.id = candidates.id
    RETURNING delivery.id, delivery.kind, delivery."to", delivery."toName",
      delivery."senderName", delivery.content, delivery."postTitle", delivery."postUrl",
      delivery.attempts, delivery."claimedAt"
  `
  const results = await Promise.all(deliveries.map(async (delivery) => {
    const where = { id: delivery.id, claimedAt: delivery.claimedAt, status: "PROCESSING" }
    try {
      const common = {
        postTitle: delivery.postTitle,
        postUrl: delivery.postUrl,
        to: delivery.to,
        toName: delivery.toName,
        idempotencyKey: `comment-email-${delivery.id}`,
      }
      if (delivery.kind === "REPLY") {
        await sendCommentReplyEmail({ ...common, repliedByName: delivery.senderName, replyContent: delivery.content })
      } else if (delivery.kind === "POST_COMMENT") {
        await sendPostCommentEmail({ ...common, commenterName: delivery.senderName, commentContent: delivery.content })
      } else {
        throw new Error("Unknown comment notification kind")
      }
      await prisma.commentEmailDelivery.updateMany({
        where, data: { status: "SENT", sentAt: new Date(), claimedAt: null },
      })
      return true
    } catch {
      // Do not log provider errors that could contain recipient addresses.
      console.error("[comment email queue] Delivery failed", delivery.id)
      await prisma.commentEmailDelivery.updateMany({
        where,
        data: {
          status: delivery.attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
          claimedAt: null,
          nextAttemptAt: new Date(Date.now() + delivery.attempts * 5 * 60 * 1000),
        },
      })
      return false
    }
  }))
  return { claimed: deliveries.length, sent: results.filter(Boolean).length, failed: results.filter((result) => !result).length }
}
