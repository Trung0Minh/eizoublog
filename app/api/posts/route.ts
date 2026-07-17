import type { Prisma, PostStatus } from "@prisma/client"
import type { Session } from "next-auth"
import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import {
  getPostSnapshotChecksum,
  type PostRecoverySnapshot,
  validatePostContentSize,
} from "@/lib/postDurability"
import { prisma } from "@/lib/prisma"
import { ensureUniqueSlug, generateSlug } from "@/lib/utils"

const querySchema = z.object({
  authorUsername: z.string().trim().min(1).optional(),
  categorySlug: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagSlug: z.string().trim().min(1).optional(),
})

const createSchema = z.object({
  categoryId: z.string().min(1).optional(),
  coAuthorIds: z.array(z.string().min(1)).default([]),
  content: z.record(z.string(), z.unknown()),
  contentText: z.string().optional(),
  coverAlt: z.string().max(200).optional(),
  coverUrl: z.string().url().optional(),
  draftVisibility: z.enum(["PRIVATE", "CO_AUTHORS"]).default("PRIVATE"),
  excerpt: z.string().trim().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  tagIds: z.array(z.string().min(1)).default([]),
  title: z.string().trim().min(1).max(200),
})

const postListSelect = {
  _count: { select: { comments: true } },
  author: {
    select: { avatarUrl: true, id: true, name: true, username: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      order: true,
      status: true,
      user: {
        select: { avatarUrl: true, id: true, name: true, username: true },
      },
    },
  },
  coverAlt: true,
  coverUrl: true,
  draftVisibility: true,
  excerpt: true,
  id: true,
  lastSavedAt: true,
  publishedAt: true,
  slug: true,
  status: true,
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  title: true,
} satisfies Prisma.PostSelect

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function getVisibilityWhere(
  session: Session | null,
  status?: PostStatus,
): Prisma.PostWhereInput {
  if (session?.user.role === "ADMIN") {
    return status ? { status } : {}
  }

  if (session) {
    if (status === "ARCHIVED") {
      return {
        AND: [{ status: "ARCHIVED" }, { id: "__archived_not_visible__" }],
      }
    }

    if (status === "DRAFT") {
      return {
        OR: [
          { authorId: session.user.id, status: "DRAFT" },
          {
            coAuthors: { some: { userId: session.user.id, status: "ACCEPTED" } },
            status: "DRAFT",
          },
        ],
      }
    }

    if (status === "PUBLISHED") {
      return { status: "PUBLISHED" }
    }

    return {
      OR: [
        { status: "PUBLISHED" },
        { authorId: session.user.id, status: "DRAFT" },
        {
          coAuthors: { some: { userId: session.user.id, status: "ACCEPTED" } },
          status: "DRAFT",
        },
      ],
    }
  }

  return { status: "PUBLISHED" }
}

export async function GET(request: Request) {
  const session = await auth()

  try {
    const { searchParams } = new URL(request.url)
    const {
      authorUsername,
      categorySlug,
      limit,
      page,
      status,
      tagSlug,
    } = querySchema.parse(Object.fromEntries(searchParams))

    const where: Prisma.PostWhereInput = {
      ...getVisibilityWhere(session, status),
      ...(authorUsername && { author: { username: authorUsername } }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
    }

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: postListSelect,
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
      prisma.post.count({ where }),
    ])

    return Response.json({
      data: {
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit),
        },
        posts,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[GET /api/posts]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = createSchema.parse(await request.json())
    const sizeError = validatePostContentSize(data)
    if (sizeError) {
      return Response.json({ error: sizeError }, { status: 413 })
    }
    if (data.status === "PUBLISHED" && (!data.contentText || !data.contentText.trim())) {
      return Response.json({ error: "Nội dung bài viết không được để trống khi đăng." }, { status: 400 })
    }
    const post = await prisma.$transaction(async (tx) => {
      const baseSlug = generateSlug(data.title) || "post"
      const slug = await ensureUniqueSlug(baseSlug, tx)

      const created = await tx.post.create({
        data: {
          author: { connect: { id: activeSession.user.id } },
          content: data.content as Prisma.InputJsonObject,
          contentText: data.contentText?.trim() || undefined,
          coverAlt: data.coverAlt?.trim() || undefined,
          coverUrl: data.coverUrl,
          draftVisibility: data.draftVisibility,
          excerpt: data.excerpt || undefined,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
          slug,
          status: data.status,
          title: data.title,
          ...(data.categoryId && {
            category: { connect: { id: data.categoryId } },
          }),
          coAuthors: {
            create: uniqueIds(data.coAuthorIds).map((userId, order) => ({
              order,
              user: { connect: { id: userId } },
            })),
          },
          tags: {
            create: uniqueIds(data.tagIds).map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        },
        select: { id: true, lastSavedAt: true, slug: true, status: true, version: true },
      })

      const snapshot: PostRecoverySnapshot = {
        authorId: activeSession.user.id,
        categoryId: data.categoryId ?? null,
        coAuthorIds: uniqueIds(data.coAuthorIds),
        content: data.content as unknown as Prisma.JsonValue,
        contentText: data.contentText?.trim() || null,
        coverAlt: data.coverAlt?.trim() || null,
        coverUrl: data.coverUrl ?? null,
        draftVisibility: data.draftVisibility,
        excerpt: data.excerpt || null,
        publishedAt: data.status === "PUBLISHED" ? new Date().toISOString() : null,
        removedAt: null,
        removedFromStatus: null,
        slug: created.slug,
        status: data.status,
        tagIds: uniqueIds(data.tagIds),
        title: data.title,
        version: created.version ?? 1,
      }

      await tx.postRevision.create({
        data: {
          actorId: activeSession.user.id,
          checksum: getPostSnapshotChecksum(snapshot),
          kind: "BASELINE",
          postId: created.id,
          snapshot: snapshot as unknown as Prisma.InputJsonObject,
          sourceVersion: snapshot.version,
        },
        select: { id: true },
      })

      await tx.postAuditEvent.create({
        data: {
          action: "SAVE",
          actorId: activeSession.user.id,
          metadata: { kind: "CREATE" },
          postId: created.id,
          sourceVersion: snapshot.version,
        },
        select: { id: true },
      })

      return created
    })

    revalidatePostMutationPaths([post.slug])

    return Response.json({ data: post }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/posts]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
