import { PostCommentEmail } from "@/emails/PostCommentEmail"
import { Resend } from "resend"

import { CommentReplyEmail } from "@/emails/CommentReplyEmail"
import { InviteEmail } from "@/emails/InviteEmail"
import { NewsletterEmail } from "@/emails/NewsletterEmail"
import { PasswordResetEmail } from "@/emails/PasswordResetEmail"
import { SubscribeConfirmationEmail } from "@/emails/SubscribeConfirmationEmail"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInviteEmailOptions {
  to: string
  inviteToken: string
  invitedByName: string
}

export async function sendInviteEmail({
  to,
  inviteToken,
  invitedByName,
}: SendInviteEmailOptions) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = process.env.RESEND_FROM_EMAIL

  if (!appUrl || !from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const inviteUrl = `${appUrl}/invite/${inviteToken}`
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${invitedByName} invited you to write on Anime Blog`,
    react: InviteEmail({ invitedByName, inviteUrl }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

interface SendCommentReplyEmailOptions {
  postTitle: string
  postUrl: string
  repliedByName: string
  replyContent: string
  to: string
  toName: string
}

export async function sendCommentReplyEmail({
  postTitle,
  postUrl,
  repliedByName,
  replyContent,
  to,
  toName,
}: SendCommentReplyEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: CommentReplyEmail({
      postTitle,
      postUrl,
      repliedByName,
      replyContent,
      toName,
    }),
    subject: `${repliedByName} replied to your comment on "${postTitle}"`,
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

interface SendSubscribeConfirmationEmailOptions {
  to: string
}

export async function sendSubscribeConfirmationEmail({
  to,
}: SendSubscribeConfirmationEmailOptions) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = process.env.RESEND_FROM_EMAIL

  if (!appUrl || !from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: SubscribeConfirmationEmail({ appName, appUrl }),
    subject: `You are subscribed to ${appName}`,
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

interface SendPasswordResetEmailOptions {
  resetUrl: string
  to: string
}

export async function sendPasswordResetEmail({
  resetUrl,
  to,
}: SendPasswordResetEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: PasswordResetEmail({ resetUrl }),
    subject: "Reset your Anime Blog password",
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

interface NewsletterFeaturedPost {
  coverUrl: string | null
  excerpt: string | null
  title: string
  url: string
}

interface SendNewsletterBroadcastOptions {
  customBody?: string
  featuredPost: NewsletterFeaturedPost | null
  previewText?: string
  subject: string
  to: string
  unsubscribeUrl: string
}

export async function sendNewsletterBroadcast({
  customBody,
  featuredPost,
  previewText,
  subject,
  to,
  unsubscribeUrl,
}: SendNewsletterBroadcastOptions) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: NewsletterEmail({
      appName,
      customBody,
      featuredPost,
      previewText,
      subject,
      unsubscribeUrl,
    }),
    subject,
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}


interface SendPostCommentEmailOptions {
  postTitle: string
  postUrl: string
  commenterName: string
  commentContent: string
  to: string
  toName: string
}

export async function sendPostCommentEmail({
  postTitle,
  postUrl,
  commenterName,
  commentContent,
  to,
  toName,
}: SendPostCommentEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: PostCommentEmail({
      postTitle,
      postUrl,
      commenterName,
      commentContent,
      toName,
    }),
    subject: `New comment on your post "${postTitle}"`,
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
