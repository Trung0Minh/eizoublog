import { Prisma } from "@prisma/client"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  MAX_POST_BACKUP_BYTES,
  type NormalizedPostBackup,
  parsePostBackup,
  type PostBackupReference,
} from "@/lib/postBackup"
import {
  getPostSnapshotChecksum,
  type PostRecoverySnapshot,
} from "@/lib/postDurability"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"
import { ensureUniqueSlug, generateSlug } from "@/lib/utils"

const requestSchema = z.discriminatedUnion("mode", [
  z.object({ backup: z.unknown(), mode: z.literal("CREATE_DRAFT") }),
  z.object({
    backup: z.unknown(),
    baseVersion: z.number().int().positive(),
    mode: z.literal("OVERWRITE"),
    targetPostId: z.string().min(1),
  }),
])

interface ResolvedTaxonomy {
  categoryId: string | null
  tagIds: string[]
  warnings: string[]
}

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, title: true, version: true },
      where: {
        finalAwardEvent: { is: null },
        status: { in: ["DRAFT", "PUBLISHED"] },
        ...(activeSession.user.role === "WRITER" && {
          authorId: activeSession.user.id,
        }),
      },
    })
    return Response.json({ data: { posts } })
  } catch (error) {
    console.error("[GET /api/posts/import]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

function referenceLabel(reference: PostBackupReference) {
  return reference.slug ?? reference.id ?? "unknown"
}

async function resolveTaxonomy(
  tx: Prisma.TransactionClient,
  backup: NormalizedPostBackup,
): Promise<ResolvedTaxonomy> {
  const warnings: string[] = []
  let categoryId: string | null = null

  if (backup.category) {
    const category = await tx.category.findFirst({
      select: { id: true },
      where: {
        OR: [
          ...(backup.category.slug ? [{ slug: backup.category.slug }] : []),
          ...(backup.category.id ? [{ id: backup.category.id }] : []),
        ],
      },
    })
    if (category) categoryId = category.id
    else warnings.push(`Category "${referenceLabel(backup.category)}" was not found.`)
  }

  const tagIds: string[] = []
  for (const reference of backup.tags) {
    const tag = await tx.tag.findFirst({
      select: { id: true },
      where: {
        OR: [
          ...(reference.slug ? [{ slug: reference.slug }] : []),
          ...(reference.id ? [{ id: reference.id }] : []),
        ],
      },
    })
    if (tag) tagIds.push(tag.id)
    else warnings.push(`Tag "${referenceLabel(reference)}" was not found.`)
  }

  return { categoryId, tagIds: Array.from(new Set(tagIds)), warnings }
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, "utf8") > MAX_POST_BACKUP_BYTES) {
      return Response.json({ error: "Backup file is too large" }, { status: 413 })
    }

    const input = requestSchema.parse(JSON.parse(rawBody) as unknown)
    const backup = parsePostBackup(input.backup)
    const result = await prisma.$transaction(async (tx) => {
      if (input.mode === "CREATE_DRAFT") {
        const taxonomy = await resolveTaxonomy(tx, backup)
        const title = backup.title ?? "Imported draft"
        const slug = await ensureUniqueSlug(generateSlug(title) || "imported-draft", tx)
        const created = await tx.post.create({
          data: {
            authorId: activeSession.user.id,
            categoryId: taxonomy.categoryId,
            content: backup.content as Prisma.InputJsonObject,
            contentText: backup.contentText,
            coverAlt: backup.coverAlt,
            coverUrl: backup.coverUrl,
            draftVisibility: "PRIVATE",
            excerpt: backup.excerpt,
            excerptContent: backup.excerptContent
              ? (backup.excerptContent as Prisma.InputJsonObject)
              : Prisma.JsonNull,
            lastSavedAt: new Date(),
            slug,
            status: "DRAFT",
            tags: {
              create: taxonomy.tagIds.map((tagId) => ({ tagId })),
            },
            title,
          },
          select: { id: true, slug: true, status: true, version: true },
        })
        const snapshot: PostRecoverySnapshot = {
          authorId: activeSession.user.id,
          categoryId: taxonomy.categoryId,
          coAuthorIds: [],
          content: backup.content as Prisma.JsonValue,
          contentText: backup.contentText,
          coverAlt: backup.coverAlt,
          coverUrl: backup.coverUrl,
          draftVisibility: "PRIVATE",
          excerpt: backup.excerpt,
          excerptContent: backup.excerptContent as Prisma.JsonValue | null,
          publishedAt: null,
          removedAt: null,
          removedFromStatus: null,
          slug: created.slug,
          status: "DRAFT",
          tagIds: taxonomy.tagIds,
          title,
          version: created.version,
        }
        await tx.postRevision.create({
          data: {
            actorId: activeSession.user.id,
            checksum: getPostSnapshotChecksum(snapshot),
            kind: "BASELINE",
            postId: created.id,
            snapshot: snapshot as unknown as Prisma.InputJsonObject,
            sourceVersion: created.version,
          },
          select: { id: true },
        })
        await tx.postAuditEvent.create({
          data: {
            action: "SAVE",
            actorId: activeSession.user.id,
            metadata: { kind: "IMPORT_CREATE" },
            postId: created.id,
            sourceVersion: created.version,
          },
          select: { id: true },
        })
        return { mode: input.mode, post: created, warnings: taxonomy.warnings }
      }

      const existing = await tx.post.findUnique({
        select: {
          authorId: true,
          categoryId: true,
          coAuthors: { select: { userId: true } },
          content: true,
          contentText: true,
          coverAlt: true,
          coverUrl: true,
          draftVisibility: true,
          excerpt: true,
          excerptContent: true,
          id: true,
          publishedAt: true,
          removedAt: true,
          removedFromStatus: true,
          slug: true,
          status: true,
          tags: { select: { tagId: true } },
          title: true,
          version: true,
        },
        where: { id: input.targetPostId },
      })
      if (!existing || existing.status === "ARCHIVED" || existing.status === "REMOVED") {
        return { error: "Post not found", status: 404 } as const
      }
      if (
        activeSession.user.role !== "ADMIN" &&
        existing.authorId !== activeSession.user.id
      ) {
        return { error: "Forbidden", status: 403 } as const
      }
      if (existing.version !== input.baseVersion) {
        return {
          error: "Post changed in another session. Choose it again before importing.",
          status: 409,
        } as const
      }

      const taxonomy = await resolveTaxonomy(tx, backup)

      const guardSnapshot: PostRecoverySnapshot = {
        authorId: existing.authorId,
        categoryId: existing.categoryId,
        coAuthorIds: existing.coAuthors.map(({ userId }) => userId),
        content: existing.content,
        contentText: existing.contentText,
        coverAlt: existing.coverAlt,
        coverUrl: existing.coverUrl,
        draftVisibility: existing.draftVisibility,
        excerpt: existing.excerpt,
        excerptContent: existing.excerptContent,
        publishedAt: existing.publishedAt?.toISOString() ?? null,
        removedAt: existing.removedAt?.toISOString() ?? null,
        removedFromStatus: existing.removedFromStatus,
        slug: existing.slug,
        status: existing.status,
        tagIds: existing.tags.map(({ tagId }) => tagId),
        title: existing.title,
        version: existing.version,
      }
      await tx.postRevision.create({
        data: {
          actorId: activeSession.user.id,
          checksum: getPostSnapshotChecksum(guardSnapshot),
          kind: "IMPORT_GUARD",
          postId: existing.id,
          snapshot: guardSnapshot as unknown as Prisma.InputJsonObject,
          sourceVersion: existing.version,
        },
        select: { id: true },
      })

      await tx.postTag.deleteMany({ where: { postId: existing.id } })
      if (taxonomy.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: taxonomy.tagIds.map((tagId) => ({ postId: existing.id, tagId })),
        })
      }
      const updated = await tx.post.update({
        data: {
          categoryId: taxonomy.categoryId,
          content: backup.content as Prisma.InputJsonObject,
          contentText: backup.contentText,
          coverAlt: backup.coverAlt,
          coverUrl: backup.coverUrl,
          excerpt: backup.excerpt,
          excerptContent: backup.excerptContent
            ? (backup.excerptContent as Prisma.InputJsonObject)
            : Prisma.JsonNull,
          featuredAt: null,
          lastSavedAt: new Date(),
          moderationLockedAt: null,
          publishedAt: null,
          removedAt: null,
          removedFromStatus: null,
          status: "DRAFT",
          title: backup.title ?? existing.title,
          version: { increment: 1 },
        },
        select: { id: true, slug: true, status: true, version: true },
        where: { id: existing.id, version: input.baseVersion },
      })
      await tx.postAuditEvent.create({
        data: {
          action: "SAVE",
          actorId: activeSession.user.id,
          metadata: { kind: "IMPORT_OVERWRITE" },
          postId: existing.id,
          sourceVersion: updated.version,
        },
        select: { id: true },
      })
      return { mode: input.mode, post: updated, warnings: taxonomy.warnings }
    })

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status })
    }
    revalidatePostMutationPaths([result.post.slug])
    return Response.json({ data: result })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return Response.json({ error: "Invalid backup file" }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes("too large")) {
      return Response.json({ error: error.message }, { status: 413 })
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { error: "Post changed in another session. Choose it again before importing." },
        { status: 409 },
      )
    }
    console.error("[POST /api/posts/import]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
