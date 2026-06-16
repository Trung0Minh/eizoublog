import type { Prisma } from "@prisma/client"

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

export type NotificationComment = Prisma.CommentGetPayload<{
  select: typeof notificationCommentSelect
}>

export type NotificationInvite = Prisma.PostAuthorGetPayload<{
  select: typeof notificationInviteSelect
}>

export async function getNotificationCounts(user: NotificationUser) {
  const [unreadComments, pendingInvites] = await Promise.all([
    prisma.comment.count({ where: unreadCommentWhere(user) }),
    prisma.postAuthor.count({ where: pendingInviteWhere(user) }),
  ])

  return {
    pendingInvites,
    total: unreadComments + pendingInvites,
    unreadComments,
  }
}

export async function getNotifications(user: NotificationUser) {
  const [unreadComments, pendingInvites] = await Promise.all([
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
  ])

  return { pendingInvites, unreadComments }
}

export async function markUnreadCommentsRead(user: NotificationUser) {
  return prisma.comment.updateMany({
    data: { isRead: true },
    where: unreadCommentWhere(user),
  })
}
