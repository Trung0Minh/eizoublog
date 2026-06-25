import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const tx = {
    newsletterBroadcast: { create: vi.fn() },
    newsletterSubscriber: { findMany: vi.fn() },
  }
  const prisma = {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    newsletterBroadcast: { update: vi.fn() },
    newsletterBroadcastRecipient: {
      groupBy: vi.fn(),
      updateMany: vi.fn(),
    },
  }

  return {
    prisma,
    sendNewsletterBroadcast: vi.fn(),
    tx,
  }
})

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/resend", () => ({
  sendNewsletterBroadcast: mocks.sendNewsletterBroadcast,
}))

import {
  enqueueNewsletterBroadcast,
  processNewsletterQueue,
} from "@/lib/newsletterQueue"

describe("newsletter queue", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
    )
  })

  it("atomically snapshots active recipients when enqueueing", async () => {
    mocks.tx.newsletterSubscriber.findMany.mockResolvedValue([
      { email: "one@example.com", id: "subscriber-1", token: "token-one" },
      { email: "two@example.com", id: "subscriber-2", token: "token-two" },
    ])
    mocks.tx.newsletterBroadcast.create.mockResolvedValue({
      id: "broadcast-1",
    })

    await expect(
      enqueueNewsletterBroadcast({
        appUrl: "https://animeblog.example",
        customBody: "Hello",
        featuredPost: null,
        previewText: "Preview",
        subject: "Issue",
      }),
    ).resolves.toEqual({
      broadcastId: "broadcast-1",
      queued: 2,
      total: 2,
    })

    expect(mocks.tx.newsletterBroadcast.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipients: {
          create: [
            expect.objectContaining({
              email: "one@example.com",
              subscriberId: "subscriber-1",
              unsubscribeUrl:
                "https://animeblog.example/unsubscribe?token=token-one",
            }),
            expect.objectContaining({
              email: "two@example.com",
              subscriberId: "subscriber-2",
            }),
          ],
        },
        totalCount: 2,
      }),
      select: { id: true },
    })
  })

  it("marks an empty broadcast complete when there are no active subscribers", async () => {
    mocks.tx.newsletterSubscriber.findMany.mockResolvedValue([])
    mocks.tx.newsletterBroadcast.create.mockResolvedValue({
      id: "broadcast-empty",
    })

    await enqueueNewsletterBroadcast({
      appUrl: "https://animeblog.example",
      customBody: "Hello",
      featuredPost: null,
      subject: "Issue",
    })

    expect(mocks.tx.newsletterBroadcast.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt: expect.any(Date),
        status: "COMPLETED",
        totalCount: 0,
      }),
      select: { id: true },
    })
  })

  it("marks claimed recipients sent and completes their broadcast", async () => {
    const claimedAt = new Date("2026-06-25T05:00:00.000Z")
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        attempts: 1,
        broadcastId: "broadcast-1",
        claimedAt,
        customBody: "Hello",
        email: "one@example.com",
        featuredCoverUrl: null,
        featuredExcerpt: null,
        featuredTitle: null,
        featuredUrl: null,
        id: "recipient-1",
        previewText: "Preview",
        subject: "Issue",
        unsubscribeUrl:
          "https://animeblog.example/unsubscribe?token=token-one",
      },
    ])
    mocks.sendNewsletterBroadcast.mockResolvedValue(undefined)
    mocks.prisma.newsletterBroadcastRecipient.updateMany.mockResolvedValue({
      count: 1,
    })
    mocks.prisma.newsletterBroadcastRecipient.groupBy.mockResolvedValue([
      { _count: { _all: 1 }, status: "SENT" },
    ])
    mocks.prisma.newsletterBroadcast.update.mockResolvedValue({
      id: "broadcast-1",
    })

    await expect(processNewsletterQueue({ maxBatches: 1 })).resolves.toEqual({
      claimed: 1,
      failed: 0,
      sent: 1,
    })

    const claimSql = String(mocks.prisma.$queryRaw.mock.calls[0]?.[0])
    expect(claimSql).toContain("recipient.attempts <= ")
    expect(claimSql).toContain(
      "CASE WHEN recipient.status = 'PENDING' THEN 1 ELSE 0 END",
    )
    expect(mocks.sendNewsletterBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "newsletter-recipient-recipient-1",
        subject: "Issue",
        to: "one@example.com",
      }),
    )
    expect(
      mocks.prisma.newsletterBroadcastRecipient.updateMany,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimedAt: null,
        lastError: null,
        sentAt: expect.any(Date),
        status: "SENT",
      }),
      where: {
        claimedAt,
        id: "recipient-1",
        status: "PROCESSING",
      },
    })
    expect(mocks.prisma.newsletterBroadcast.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt: expect.any(Date),
        failedCount: 0,
        sentCount: 1,
        status: "COMPLETED",
      }),
      where: { id: "broadcast-1" },
    })
  })

  it("returns failed recipients to pending until the final attempt", async () => {
    const claimedAt = new Date("2026-06-25T05:00:00.000Z")
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        attempts: 2,
        broadcastId: "broadcast-1",
        claimedAt,
        customBody: "Hello",
        email: "one@example.com",
        featuredCoverUrl: null,
        featuredExcerpt: null,
        featuredTitle: null,
        featuredUrl: null,
        id: "recipient-1",
        previewText: null,
        subject: "Issue",
        unsubscribeUrl:
          "https://animeblog.example/unsubscribe?token=token-one",
      },
    ])
    mocks.sendNewsletterBroadcast.mockRejectedValue(new Error("Temporary"))
    mocks.prisma.newsletterBroadcastRecipient.updateMany.mockResolvedValue({
      count: 1,
    })
    mocks.prisma.newsletterBroadcastRecipient.groupBy.mockResolvedValue([
      { _count: { _all: 1 }, status: "PENDING" },
    ])

    await processNewsletterQueue({ maxBatches: 1 })

    expect(
      mocks.prisma.newsletterBroadcastRecipient.updateMany,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimedAt: null,
        lastError: "Temporary",
        nextAttemptAt: expect.any(Date),
        status: "PENDING",
      }),
      where: {
        claimedAt,
        id: "recipient-1",
        status: "PROCESSING",
      },
    })
  })
})
