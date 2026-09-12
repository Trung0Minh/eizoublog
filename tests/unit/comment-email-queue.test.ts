import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  update: vi.fn(),
  reply: vi.fn(),
  comment: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({ prisma: {
  $queryRaw: mocks.claim,
  commentEmailDelivery: { updateMany: mocks.update },
} }))
vi.mock("@/lib/resend", () => ({
  sendCommentReplyEmail: mocks.reply,
  sendPostCommentEmail: mocks.comment,
}))

import { processCommentEmailQueue } from "@/lib/commentEmailQueue"

const delivery = {
  id: "delivery-1", kind: "REPLY", attempts: 1,
  claimedAt: new Date("2026-09-11T00:00:00Z"),
  postTitle: "Article", postUrl: "https://example.test/article#comment-1",
  senderName: "Reader", content: "Hello", to: "parent@example.test", toName: "Parent",
}

describe("comment email delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.claim.mockResolvedValue([delivery])
    mocks.update.mockResolvedValue({ count: 1 })
  })

  it("sends the existing reply payload with a stable provider idempotency key", async () => {
    await expect(processCommentEmailQueue()).resolves.toEqual({ claimed: 1, sent: 1, failed: 0 })
    expect(mocks.reply).toHaveBeenCalledWith({
      postTitle: delivery.postTitle, postUrl: delivery.postUrl,
      repliedByName: delivery.senderName, replyContent: delivery.content,
      to: delivery.to, toName: delivery.toName, idempotencyKey: "comment-email-delivery-1",
    })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: delivery.id, claimedAt: delivery.claimedAt, status: "PROCESSING" },
      data: expect.objectContaining({ status: "SENT" }),
    }))
  })

  it("retains failed deliveries for retry without creating another comment", async () => {
    mocks.reply.mockRejectedValue(new Error("provider unavailable"))
    await expect(processCommentEmailQueue()).resolves.toEqual({ claimed: 1, sent: 0, failed: 1 })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PENDING", nextAttemptAt: expect.any(Date) }),
    }))
  })

  it("stops retrying after three delivery attempts", async () => {
    mocks.claim.mockResolvedValue([{ ...delivery, attempts: 3 }])
    mocks.reply.mockRejectedValue(new Error("provider unavailable"))
    await processCommentEmailQueue()
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "FAILED" }),
    }))
  })

  it("uses the post-comment template for credited authors", async () => {
    mocks.claim.mockResolvedValue([{ ...delivery, kind: "POST_COMMENT" }])
    await processCommentEmailQueue()
    expect(mocks.comment).toHaveBeenCalledWith(expect.objectContaining({
      commenterName: delivery.senderName, commentContent: delivery.content,
      idempotencyKey: "comment-email-delivery-1",
    }))
    expect(mocks.reply).not.toHaveBeenCalled()
  })
})
