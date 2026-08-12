import type { NotificationType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export interface NotificationUser {
  email: string
  id: string
}

function commentNotificationWhere(user: NotificationUser) {
  return {
    authorEmail: { not: user.email },
    post: {
      OR: [
        { authorId: user.id },
        {
          coAuthors: {
            some: { status: "ACCEPTED", userId: user.id },
          },
        },
        {
          finalAwardEvent: {
            rooms: {
              some: {
                excludedAt: null,
                status: "SUBMITTED",
                writerId: user.id,
              },
            },
          },
        },
      ],
      status: { notIn: ["ARCHIVED", "REMOVED"] },
    },
    status: "APPROVED",
  } satisfies Prisma.CommentWhereInput
}

function unreadCommentWhere(user: NotificationUser) {
  return {
    ...commentNotificationWhere(user),
    readBy: { none: { userId: user.id } },
  } satisfies Prisma.CommentWhereInput
}

export const notificationCommentSelect = {
  authorName: true,
  content: true,
  createdAt: true,
  id: true,
  isRead: true,
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
  readAt: true,
  type: true,
} satisfies Prisma.NotificationSelect

export type NotificationComment = Prisma.CommentGetPayload<{
  select: typeof notificationCommentSelect
}>

export interface NotificationEventRoomComment {
  author: {
    name: string
    username: string
  }
  content: string
  createdAt: Date | string
  event: {
    id: string
    title: string
  }
  id: string
  isRead: boolean
  room: {
    id: string
    title: string
  }
}

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
  unreadEventRoomComments: DbCount
}

interface NotificationsRow {
  pendingInvites: NotificationInvite[]
  responseEvents: NotificationEvent[]
  unreadComments: Array<NotificationComment | NotificationEventRoomComment>
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
          AND c.status = 'APPROVED'
          AND p.status NOT IN ('ARCHIVED', 'REMOVED')
          AND (
            p."authorId" = ${user.id}
            OR EXISTS (
              SELECT 1
              FROM post_authors pa
              WHERE pa."postId" = p.id
                AND pa."userId" = ${user.id}
                AND pa.status = 'ACCEPTED'
            )
            OR EXISTS (
              SELECT 1
              FROM award_events event
              JOIN award_event_rooms event_room
                ON event_room."eventId" = event.id
              WHERE event."finalPostId" = p.id
                AND event_room."writerId" = ${user.id}
                AND event_room.status = 'SUBMITTED'
                AND event_room."excludedAt" IS NULL
            )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM comment_reads comment_read
            WHERE comment_read."commentId" = c.id
              AND comment_read."userId" = ${user.id}
          )
      ) AS "unreadComments",
      (
        SELECT COUNT(*)
        FROM award_event_room_comments arc
        JOIN award_event_rooms room ON room.id = arc."roomId"
        WHERE room."writerId" = ${user.id}
          AND arc."authorId" <> ${user.id}
          AND arc."isRead" = false
      ) AS "unreadEventRoomComments",
      (
        SELECT COUNT(*)
        FROM post_authors pa
        JOIN posts p ON p.id = pa."postId"
        WHERE pa."userId" = ${user.id}
          AND pa.status = 'PENDING'
          AND p.status NOT IN ('ARCHIVED', 'REMOVED')
      ) AS "pendingInvites",
      (
        SELECT COUNT(*)
        FROM notifications n
        WHERE n."userId" = ${user.id}
          AND n."readAt" IS NULL
      ) AS "responseEvents"
  `

  const unreadComments = countToNumber(counts?.unreadComments)
  const unreadEventRoomComments = countToNumber(counts?.unreadEventRoomComments)
  const pendingInvites = countToNumber(counts?.pendingInvites)
  const responseEvents = countToNumber(counts?.responseEvents)

  return {
    pendingInvites,
    responseEvents,
    total: unreadComments + unreadEventRoomComments + pendingInvites + responseEvents,
    unreadComments: unreadComments + unreadEventRoomComments,
  }
}

export async function getNotifications(user: NotificationUser) {
  const [row] = await prisma.$queryRaw<NotificationsRow[]>`
    SELECT
      (
        COALESCE(
          (
            SELECT jsonb_agg(item ORDER BY (item->>'createdAt') DESC)
            FROM (
              SELECT jsonb_build_object(
                'authorName', c."authorName",
                'content', c.content,
                'createdAt', c."createdAt",
                'id', c.id,
                'isRead', EXISTS (
                  SELECT 1
                  FROM comment_reads comment_read
                  WHERE comment_read."commentId" = c.id
                    AND comment_read."userId" = ${user.id}
                ),
                'post', jsonb_build_object(
                  'slug', p.slug,
                  'title', p.title
                )
              ) AS item
              FROM comments c
              JOIN posts p ON p.id = c."postId"
              WHERE c."authorEmail" <> ${user.email}
                AND c.status = 'APPROVED'
                AND p.status NOT IN ('ARCHIVED', 'REMOVED')
                AND (
                  p."authorId" = ${user.id}
                  OR EXISTS (
                    SELECT 1
                    FROM post_authors accepted_author
                    WHERE accepted_author."postId" = p.id
                      AND accepted_author."userId" = ${user.id}
                      AND accepted_author.status = 'ACCEPTED'
                  )
                  OR EXISTS (
                    SELECT 1
                    FROM award_events event
                    JOIN award_event_rooms event_room
                      ON event_room."eventId" = event.id
                    WHERE event."finalPostId" = p.id
                      AND event_room."writerId" = ${user.id}
                      AND event_room.status = 'SUBMITTED'
                      AND event_room."excludedAt" IS NULL
                  )
                )
              ORDER BY c."createdAt" DESC
              LIMIT 25
            ) comments
          ),
          '[]'::jsonb
        ) ||
        COALESCE(
          (
            SELECT jsonb_agg(item ORDER BY (item->>'createdAt') DESC)
            FROM (
              SELECT jsonb_build_object(
                'author', jsonb_build_object(
                  'name', author.name,
                  'username', author.username
                ),
                'content', arc.content,
                'createdAt', arc."createdAt",
                'event', jsonb_build_object(
                  'id', event.id,
                  'title', event.title
                ),
                'id', arc.id,
                'isRead', arc."isRead",
                'room', jsonb_build_object(
                  'id', room.id,
                  'title', COALESCE(room."submittedPostTitle", selected_post.title, 'Bài tham gia')
                )
              ) AS item
              FROM award_event_room_comments arc
              JOIN award_event_rooms room ON room.id = arc."roomId"
              JOIN award_events event ON event.id = room."eventId"
              JOIN users author ON author.id = arc."authorId"
              LEFT JOIN posts selected_post ON selected_post.id = room."postId"
              WHERE room."writerId" = ${user.id}
                AND arc."authorId" <> ${user.id}
              ORDER BY arc."createdAt" DESC
              LIMIT 25
            ) event_room_comments
          ),
          '[]'::jsonb
        )
      )::json AS "unreadComments",
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
              AND pa.status = 'PENDING'
              AND p.status NOT IN ('ARCHIVED', 'REMOVED')
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
              'readAt', n."readAt",
              'type', n.type::text
            ) AS item
            FROM notifications n
            WHERE n."userId" = ${user.id}
            ORDER BY n."createdAt" DESC
            LIMIT 50
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
  const [comments, eventRoomComments] = await Promise.all([
    markOwnedCommentsRead(user),
    prisma.awardEventRoomComment.updateMany({
      data: { isRead: true },
      where: {
        authorId: { not: user.id },
        isRead: false,
        room: { writerId: user.id },
      },
    }),
  ])

  return { count: comments.count + eventRoomComments.count }
}

async function markOwnedCommentsRead(user: NotificationUser) {
  const comments = await prisma.comment.findMany({
    select: { id: true },
    where: unreadCommentWhere(user),
  })

  if (comments.length === 0) return { count: 0 }

  return prisma.commentRead.createMany({
    data: comments.map(({ id: commentId }) => ({ commentId, userId: user.id })),
    skipDuplicates: true,
  })
}

export async function markNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { readAt: null, userId },
  })
}

export async function markCommentRead(commentId: string, user: NotificationUser) {
  const owned = await prisma.comment.findFirst({
    select: { id: true },
    where: { ...commentNotificationWhere(user), id: commentId },
  })

  if (!owned) return { count: 0 }

  const result = await prisma.commentRead.upsert({
    create: { commentId, userId: user.id },
    update: { readAt: new Date() },
    where: { commentId_userId: { commentId, userId: user.id } },
  })
  return { count: result ? 1 : 0 }
}

export async function markCommentUnread(commentId: string, user: NotificationUser) {
  const owned = await prisma.comment.findFirst({
    select: { id: true },
    where: { ...commentNotificationWhere(user), id: commentId },
  })

  if (!owned) return { count: 0 }

  return prisma.commentRead.deleteMany({
    where: { commentId, userId: user.id },
  })
}

export async function markEventRoomCommentRead(commentId: string, userId: string) {
  return prisma.awardEventRoomComment.updateMany({
    data: { isRead: true },
    where: {
      authorId: { not: userId },
      id: commentId,
      isRead: false,
      room: { writerId: userId },
    },
  })
}

export async function markEventRoomCommentUnread(commentId: string, userId: string) {
  return prisma.awardEventRoomComment.updateMany({
    data: { isRead: false },
    where: {
      authorId: { not: userId },
      id: commentId,
      isRead: true,
      room: { writerId: userId },
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

export async function markNotificationUnread(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    data: { readAt: null },
    where: {
      id: notificationId,
      userId,
      readAt: { not: null },
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
