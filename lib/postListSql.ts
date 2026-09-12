import { Prisma } from "@prisma/client"

// Aliases belong to the list query; count timing remains in its two branches.
export function getPublishedPostProjectionSql(commentCount: Prisma.Sql) {
  return Prisma.sql`
    json_build_object(
      'avatarUrl', author."avatarUrl",
      'name', author.name,
      'username', author.username
    ) AS author,
    CASE
      WHEN category.id IS NULL THEN NULL
      ELSE json_build_object(
        'id', category.id,
        'name', category.name,
        'slug', category.slug
      )
    END AS category,
    COALESCE(co_authors.items, '[]'::json) AS "coAuthors",
    ${commentCount},
    p."coverAlt",
    p."coverUrl",
    p."eventIntro",
    p."eventIntroText",
    p.excerpt,
    p."featuredAt",
    p."publishedAt",
    p.slug,
    COALESCE(tags.items, '[]'::json) AS tags,
    p.title,
    counted."totalCount"
  `
}

export const publishedPostCreditJoinsSql = Prisma.sql`
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'user', json_build_object(
          'avatarUrl', credited_author."avatarUrl",
          'name', credited_author.name,
          'username', credited_author.username
        )
      )
      ORDER BY credited_author."creditOrder" ASC, credited_author.name ASC
    ) AS items
    FROM (
      SELECT
        credited_user."avatarUrl",
        MIN(credit."creditOrder") AS "creditOrder",
        credited_user.id,
        credited_user.name,
        credited_user.username
      FROM (
        SELECT pa."userId", pa.order AS "creditOrder"
        FROM post_authors pa
        WHERE pa."postId" = p.id
          AND pa.status = 'ACCEPTED'

        UNION ALL

        SELECT event_room."writerId", event_room.order AS "creditOrder"
        FROM award_events event
        JOIN award_event_rooms event_room
          ON event_room."eventId" = event.id
        WHERE event."finalPostId" = p.id
          AND event_room.status = 'SUBMITTED'
          AND event_room."excludedAt" IS NULL
      ) credit
      JOIN users credited_user ON credited_user.id = credit."userId"
      WHERE credited_user.id <> p."authorId"
      GROUP BY
        credited_user.id,
        credited_user."avatarUrl",
        credited_user.name,
        credited_user.username
    ) credited_author
  ) co_authors ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'tag', json_build_object(
          'id', t.id,
          'name', t.name,
          'slug', t.slug
        )
      )
      ORDER BY t.name ASC
    ) AS items
    FROM post_tags pt
    JOIN tags t ON t.id = pt."tagId"
    WHERE pt."postId" = p.id
  ) tags ON TRUE
`
