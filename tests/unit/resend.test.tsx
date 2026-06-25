import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))

import { InviteEmail } from "@/emails/InviteEmail"
import { CommentReplyEmail } from "@/emails/CommentReplyEmail"
import { NewsletterEmail } from "@/emails/NewsletterEmail"
import { SubscribeConfirmationEmail } from "@/emails/SubscribeConfirmationEmail"
import {
  sendCommentReplyEmail,
  sendInviteEmail,
  sendNewsletterBroadcast,
  sendSubscribeConfirmationEmail,
} from "@/lib/resend"

describe("InviteEmail", () => {
  it("renders the inviter and invitation link", () => {
    const html = renderToStaticMarkup(
      InviteEmail({
        invitedByName: "Admin Writer",
        inviteUrl: "https://animeblog.example/invite/token",
      })
    )

    expect(html).toContain("Admin Writer")
    expect(html).toContain("https://animeblog.example/invite/token")
    expect(html).toContain("This link expires in 7 days")
  })
})

describe("CommentReplyEmail", () => {
  it("renders the reply summary and post link", () => {
    const html = renderToStaticMarkup(
      CommentReplyEmail({
        postTitle: "Frieren and memory",
        postUrl: "https://animeblog.example/frieren#comment-reply-1",
        repliedByName: "Mina",
        replyContent: "A sharp point about the final scene.",
        toName: "Ken",
      }),
    )

    expect(html).toContain("Mina")
    expect(html).toContain("Frieren and memory")
    expect(html).toContain("A sharp point about the final scene.")
    expect(html).toContain("https://animeblog.example/frieren#comment-reply-1")
  })
})

describe("SubscribeConfirmationEmail", () => {
  it("renders the app name and blog link", () => {
    const html = renderToStaticMarkup(
      SubscribeConfirmationEmail({
        appName: "Anime Blog",
        appUrl: "https://animeblog.example",
      }),
    )

    expect(html).toContain("Anime Blog")
    expect(html).toContain("https://animeblog.example")
    expect(html).toContain("You can unsubscribe at any time")
  })
})

describe("NewsletterEmail", () => {
  it("renders custom body, featured post, and unsubscribe link", () => {
    const html = renderToStaticMarkup(
      NewsletterEmail({
        appName: "Anime Blog",
        customBody: "Production notes from this week.",
        featuredPost: {
          coverUrl: null,
          excerpt: "A close read of stillness and memory.",
          title: "Frieren and memory",
          url: "https://animeblog.example/frieren-memory",
        },
        previewText: "A new essay is live.",
        subject: "New essay",
        unsubscribeUrl:
          "https://animeblog.example/unsubscribe?token=subscriber-token",
      }),
    )

    expect(html).toContain("New essay")
    expect(html).toContain("Production notes from this week.")
    expect(html).toContain("Frieren and memory")
    expect(html).toContain("https://animeblog.example/frieren-memory")
    expect(html).toContain(
      "https://animeblog.example/unsubscribe?token=subscriber-token",
    )
  })
})

describe("sendInviteEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://animeblog.example"
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends an invite with the correct URL", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendInviteEmail({
      to: "writer@example.com",
      inviteToken: "invite-token",
      invitedByName: "Admin Writer",
    })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        to: "writer@example.com",
        subject: "Admin Writer invited you to write on Anime Blog",
      })
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example/invite/invite-token"
    )
  })

  it("throws when Resend rejects the email", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { message: "Invalid sender" },
    })

    await expect(
      sendInviteEmail({
        to: "writer@example.com",
        inviteToken: "invite-token",
        invitedByName: "Admin Writer",
      })
    ).rejects.toThrow("Resend error: Invalid sender")
  })
})

describe("sendCommentReplyEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends a reply notification", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendCommentReplyEmail({
      postTitle: "Frieren and memory",
      postUrl: "https://animeblog.example/frieren#comment-reply-1",
      repliedByName: "Mina",
      replyContent: "A sharp point about the final scene.",
      to: "ken@example.com",
      toName: "Ken",
    })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        subject: 'Mina replied to your comment on "Frieren and memory"',
        to: "ken@example.com",
      }),
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example/frieren#comment-reply-1",
    )
  })
})

describe("sendSubscribeConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_NAME = "Anime Blog"
    process.env.NEXT_PUBLIC_APP_URL = "https://animeblog.example"
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends a subscription confirmation email", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendSubscribeConfirmationEmail({ to: "reader@example.com" })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        subject: "You are subscribed to Anime Blog",
        to: "reader@example.com",
      }),
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example",
    )
  })
})

describe("sendNewsletterBroadcast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_NAME = "Anime Blog"
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends a newsletter broadcast with a unique unsubscribe URL", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendNewsletterBroadcast({
      customBody: "Production notes from this week.",
      featuredPost: null,
      idempotencyKey: "newsletter-recipient-1",
      previewText: "A new essay is live.",
      subject: "New essay",
      to: "reader@example.com",
      unsubscribeUrl:
        "https://animeblog.example/unsubscribe?token=subscriber-token",
    })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        subject: "New essay",
        to: "reader@example.com",
      }),
      { idempotencyKey: "newsletter-recipient-1" },
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example/unsubscribe?token=subscriber-token",
    )
  })
})
