import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("Prisma Auth.js adapter schema", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8")
  const userModel = schema.match(/model User \{[\s\S]*?\n\}/)?.[0] ?? ""
  const postStatusEnum = schema.match(/enum PostStatus \{[\s\S]*?\n\}/)?.[0] ?? ""
  const notificationTypeEnum =
    schema.match(/enum NotificationType \{[\s\S]*?\n\}/)?.[0] ?? ""
  const postModel = schema.match(/model Post \{[\s\S]*?\n\}/)?.[0] ?? ""
  const commentModel = schema.match(/model Comment \{[\s\S]*?\n\}/)?.[0] ?? ""
  const inviteModel = schema.match(/model Invite \{[\s\S]*?\n\}/)?.[0] ?? ""
  const categoryModel = schema.match(/model Category \{[\s\S]*?\n\}/)?.[0] ?? ""
  const newsletterSubscriberModel =
    schema.match(/model NewsletterSubscriber \{[\s\S]*?\n\}/)?.[0] ?? ""
  const newsletterBroadcastModel =
    schema.match(/model NewsletterBroadcast \{[\s\S]*?\n\}/)?.[0] ?? ""
  const newsletterBroadcastRecipientModel =
    schema.match(/model NewsletterBroadcastRecipient \{[\s\S]*?\n\}/)?.[0] ?? ""
  const analyticsEventModel =
    schema.match(/model AnalyticsEvent \{[\s\S]*?\n\}/)?.[0] ?? ""
  const analyticsDailySummaryModel =
    schema.match(/model AnalyticsDailySummary \{[\s\S]*?\n\}/)?.[0] ?? ""
  const analyticsDailyPageModel =
    schema.match(/model AnalyticsDailyPage \{[\s\S]*?\n\}/)?.[0] ?? ""

  it("includes the standard nullable fields Auth.js writes during email sign-in", () => {
    expect(userModel).toMatch(/emailVerified\s+DateTime\?/)
    expect(userModel).toMatch(/image\s+String\?/)
  })

  it("includes archived posts as a first-class post status", () => {
    expect(postStatusEnum).toContain("ARCHIVED")
  })

  it("supports reversible post removal and moderation notifications", () => {
    expect(postStatusEnum).toContain("REMOVED")
    expect(postModel).toContain("moderationLockedAt")
    expect(postModel).toContain("removedFromStatus")
    expect(notificationTypeEnum).toContain("POST_MODERATION")
  })

  it("indexes newsletter subscriber status for broadcast queries", () => {
    expect(newsletterSubscriberModel).toContain("@@index([status])")
  })

  it("defines a durable newsletter broadcast queue", () => {
    expect(schema).toContain("enum NewsletterBroadcastStatus")
    expect(schema).toContain("enum NewsletterRecipientStatus")
    expect(newsletterSubscriberModel).toContain(
      "broadcastRecipients NewsletterBroadcastRecipient[]",
    )
    expect(newsletterBroadcastModel).toContain(
      "@@map(\"newsletter_broadcasts\")",
    )
    expect(newsletterBroadcastModel).toContain(
      "@@index([status, createdAt(sort: Asc)])",
    )
    expect(newsletterBroadcastRecipientModel).toContain(
      "@@unique([broadcastId, subscriberId])",
    )
    expect(newsletterBroadcastRecipientModel).toContain(
      "@@index([status, nextAttemptAt, claimedAt])",
    )
    expect(newsletterBroadcastRecipientModel).toContain(
      "@@map(\"newsletter_broadcast_recipients\")",
    )
  })

  it("indexes protected route navigation query patterns", () => {
    expect(postModel).toContain(
      "@@index([authorId, status, updatedAt(sort: Desc)])",
    )
    expect(commentModel).toContain("@@index([status, createdAt(sort: Desc)])")
    expect(userModel).toContain("@@index([role, createdAt(sort: Desc)])")
    expect(userModel).toContain("@@index([role, name])")
    expect(inviteModel).toContain(
      "@@index([status, expiresAt, createdAt(sort: Desc)])",
    )
    expect(categoryModel).toContain("@@index([parentId, name])")
  })

  it("defines internal analytics tables for event tracking and daily aggregates", () => {
    expect(schema).toContain("enum AnalyticsEventType")
    expect(analyticsEventModel).toContain("@@map(\"analytics_events\")")
    expect(analyticsEventModel).toContain(
      "@@index([postSlug, type, createdAt(sort: Desc)])",
    )
    expect(analyticsDailySummaryModel).toContain(
      "@@map(\"analytics_daily_summaries\")",
    )
    expect(analyticsDailySummaryModel).toContain("@@unique([day])")
    expect(analyticsDailyPageModel).toContain(
      "@@map(\"analytics_daily_pages\")",
    )
    expect(analyticsDailyPageModel).toContain("@@unique([day, path])")
  })
})
