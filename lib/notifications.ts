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

type DbCount = bigint | number | null | undefined

interface NotificationCountsRow {
  pendingInvites: DbCount
  responseEvents: DbCount
  unreadComments: DbCount
}

interface NotificationsRow {
  pendingInvites: NotificationInvite[]
  responseEvents: NotificationEvent[]
  unreadComments: NotificationComment[]
}

function countToNumber(value: DbCount) {
  if (typeof value === "bigint") {
    return Number(value)
  }

  if (typeof value === "number") {
    return value
  }

  return 0
}

export async function getNotificationCounts(user: NotificationUser) {
  const [counts] = await prisma.$queryRaw<NotificationCountsRow[]>`
    SELECT
      (
        SELECT COUNT(*)
        FROM comments c
        JOIN posts p ON p.id = c."postId"
        WHERE c."authorEmail" <> ${user.email}
          AND c."isRead" = false
          AND c.status::text = 'APPROVED'
          AND p.status::text <> 'ARCHIVED'
          AND (
            p."authorId" = ${user.id}
            OR EXISTS (
              SELECT 1
              FROM post_authors pa
              WHERE pa."postId" = p.id
                AND pa."userId" = ${user.id}
                AND pa.status::text = 'ACCEPTED'
            )
          )
      ) AS "unreadComments",
      (
        SELECT COUNT(*)
        FROM post_authors pa
        JOIN posts p ON p.id = pa."postId"
        WHERE pa."userId" = ${user.id}
          AND pa.status::text = 'PENDING'
          AND p.status::text <> 'ARCHIVED'
      ) AS "pendingInvites",
      (
        SELECT COUNT(*)
        FROM notifications n
        WHERE n."userId" = ${user.id}
          AND n."readAt" IS NULL
      ) AS "responseEvents"
  `

  const unreadComments = countToNumber(counts?.unreadComments)
  const pendingInvites = countToNumber(counts?.pendingInvites)
  const responseEvents = countToNumber(counts?.responseEvents)

  return {
    pendingInvites,
    responseEvents,
    total: unreadComments + pendingInvites + responseEvents,
    unreadComments,
  }
}

export async function getNotifications(user: NotificationUser) {
  const [row] = await prisma.$queryRaw<NotificationsRow[]>`
    SELECT
      COALESCE(
        (
          SELECT json_agg(item ORDER BY (item->>'createdAt') DESC)
          FROM (
            SELECT json_build_object(
              'authorName', c."authorName",
              'content', c.content,
              'createdAt', c."createdAt",
              'id', c.id,
              'post', json_build_object(
                'slug', p.slug,
                'title', p.title
              )
            ) AS item
            FROM comments c
            JOIN posts p ON p.id = c."postId"
            WHERE c."authorEmail" <> ${user.email}
              AND c."isRead" = false
              AND c.status::text = 'APPROVED'
              AND p.status::text <> 'ARCHIVED'
              AND (
                p."authorId" = ${user.id}
                OR EXISTS (
                  SELECT 1
                  FROM post_authors accepted_author
                  WHERE accepted_author."postId" = p.id
                    AND accepted_author."userId" = ${user.id}
                    AND accepted_author.status::text = 'ACCEPTED'
                )
              )
            ORDER BY c."createdAt" DESC
            LIMIT 25
          ) comments
        ),
        '[]'::json
      ) AS "unreadComments",
      COALESCE(
        (
          SELECT json_agg(item ORDER BY (item->'post'->>'updatedAt') DESC)
          FROM (
            SELECT json_build_object(
              'postId', pa."postId",
              'post', json_build_object(
                'author', json_build_object(
                  'name', author.name,
                  'username', author.username
                ),
                'id', p.id,
                'slug', p.slug,
                'title', p.title,
                'updatedAt', p."updatedAt"
              )
            ) AS item
            FROM post_authors pa
            JOIN posts p ON p.id = pa."postId"
            JOIN users author ON author.id = p."authorId"
            WHERE pa."userId" = ${user.id}
              AND pa.status::text = 'PENDING'
              AND p.status::text <> 'ARCHIVED'
            ORDER BY p."updatedAt" DESC
          ) invites
        ),
        '[]'::json
      ) AS "pendingInvites",
      COALESCE(
        (
          SELECT json_agg(item ORDER BY (item->>'createdAt') DESC)
          FROM (
            SELECT json_build_object(
              'createdAt', n."createdAt",
              'data', n.data,
              'id', n.id,
              'type', n.type::text
            ) AS item
            FROM notifications n
            WHERE n."userId" = ${user.id}
              AND n."readAt" IS NULL
            ORDER BY n."createdAt" DESC
            LIMIT 25
          ) events
        ),
        '[]'::json
      ) AS "responseEvents"
  `
  const unreadComments = row?.unreadComments ?? []
  const pendingInvites = row?.pendingInvites ?? []
  const responseEvents = row?.responseEvents ?? []

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

export async function markCommentRead(commentId: string, user: NotificationUser) {
  return prisma.comment.updateMany({
    data: { isRead: true },
    where: {
      ...unreadCommentWhere(user),
      id: commentId,
    },
  })
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
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
