import type { NotificationType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export interface NotificationUser {
  email: string
  id: string
}

function unreadCommentWhere(user: NotificationUser) {
  return {
    authorEmail: { not: user.email },
    isRead: false,
    post: {
      OR: [
        { authorId: user.id },
        {
          coAuthors: {
            some: { status: "ACCEPTED", userId: user.id },
          },
        },
      ],
      status: { not: "ARCHIVED" },
    },
    status: "APPROVED",
  } satisfies Prisma.CommentWhereInput
}

function pendingInviteWhere(user: NotificationUser) {
  return {
    post: { status: { not: "ARCHIVED" } },
    status: "PENDING",
    userId: user.id,
  } satisfies Prisma.PostAuthorWhereInput
}

export const notificationCommentSelect = {
  authorName: true,
  content: true,
  createdAt: true,
  id: true,
  post: {
    select: {
      slug: true,
      title: true,
    },
  },
} satisfies Prisma.CommentSelect

export const notificationInviteSelect = {
  post: {
    select: {
      author: {
        select: {
          name: true,
          username: true,
        },
      },
      id: true,
      slug: true,
      title: true,
      updatedAt: true,
    },
  },
  postId: true,
} satisfies Prisma.PostAuthorSelect

export const notificationEventSelect = {
  createdAt: true,
  data: true,
  id: true,
  type: true,
} satisfies Prisma.NotificationSelect

export type NotificationComment = Prisma.CommentGetPayload<{
  select: typeof notificationCommentSelect
}>

export type NotificationInvite = Prisma.PostAuthorGetPayload<{
  select: typeof notificationInviteSelect
}>

export type NotificationEvent = Prisma.NotificationGetPayload<{
  select: typeof notificationEventSelect
}>

interface CoAuthorResponseNotificationInput {
  actorName: string
  actorUsername: string
  postAuthorId: string
  postId: string
  postSlug: string
  postTitle: string
  type: Extract<
    NotificationType,
    "COAUTHOR_ACCEPTED" | "COAUTHOR_DECLINED"
  >
}

export async function getNotificationCounts(user: NotificationUser) {
  const [unreadComments, pendingInvites, responseEvents] = await Promise.all([
    prisma.comment.count({ where: unreadCommentWhere(user) }),
    prisma.postAuthor.count({ where: pendingInviteWhere(user) }),
    prisma.notification.count({ where: { readAt: null, userId: user.id } }),
  ])

  return {
    pendingInvites,
    responseEvents,
    total: unreadComments + pendingInvites + responseEvents,
    unreadComments,
  }
}

export async function getNotifications(user: NotificationUser) {
  const [unreadComments, pendingInvites, responseEvents] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      select: notificationCommentSelect,
      take: 25,
      where: unreadCommentWhere(user),
    }),
    prisma.postAuthor.findMany({
      orderBy: { post: { updatedAt: "desc" } },
      select: notificationInviteSelect,
      where: pendingInviteWhere(user),
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      select: notificationEventSelect,
      take: 25,
      where: { readAt: null, userId: user.id },
    }),
  ])

  return { pendingInvites, responseEvents, unreadComments }
}

export async function markUnreadCommentsRead(user: NotificationUser) {
  return prisma.comment.updateMany({
    data: { isRead: true },
    where: unreadCommentWhere(user),
  })
}

export async function markNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { readAt: null, userId },
  })
}

export async function createCoAuthorResponseNotification(
  input: CoAuthorResponseNotificationInput,
) {
  if (input.postAuthorId === "") {
    return null
  }

  return prisma.notification.create({
    data: {
      data: {
        actorName: input.actorName,
        actorUsername: input.actorUsername,
        postId: input.postId,
        postSlug: input.postSlug,
        postTitle: input.postTitle,
      },
      type: input.type,
      userId: input.postAuthorId,
    },
  })
}
