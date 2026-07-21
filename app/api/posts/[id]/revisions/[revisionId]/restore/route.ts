import { Prisma } from "@prisma/client"
import { z, ZodError } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  getPostSnapshotChecksum,
  type PostRecoverySnapshot,
} from "@/lib/postDurability"
import { revalidatePostMutationPaths } from "@/lib/postRevalidation"
import { prisma } from "@/lib/prisma"

const requestSchema = z.object({ baseVersion: z.number().int().positive() })
const snapshotSchema = z.object({
  categoryId: z.string().nullable().optional(),
  coAuthorIds: z.array(z.string()).optional(),
  content: z.record(z.string(), z.unknown()),
  contentText: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  draftVisibility: z.enum(["PRIVATE", "CO_AUTHORS"]).optional(),
  excerpt: z.string().nullable().optional(),
  excerptContent: z.record(z.string(), z.unknown()).nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  title: z.string().trim().min(1).max(200),
})

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; revisionId: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const { id, revisionId } = await params
    const { baseVersion } = requestSchema.parse(await request.json())
    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        select: { authorId: true, id: true, slug: true, version: true },
        where: { id },
      })
      if (!post) return { error: "Post not found", status: 404 } as const
      if (
        activeSession.user.role !== "ADMIN" &&
        post.authorId !== activeSession.user.id
      ) {
        return { error: "Forbidden", status: 403 } as const
      }
      if (post.version !== baseVersion) {
        return {
          error: "Post changed in another session. Your local copy was preserved.",
          status: 409,
        } as const
      }

      const revision = await tx.postRevision.findUnique({
        select: { id: true, postId: true, snapshot: true },
        where: { id: revisionId },
      })
      if (!revision || revision.postId !== id) {
        return { error: "Revision not found", status: 404 } as const
      }
      const snapshot = snapshotSchema.parse(revision.snapshot)

      if (snapshot.tagIds) {
        await tx.postTag.deleteMany({ where: { postId: id } })
        if (snapshot.tagIds.length > 0) {
          await tx.postTag.createMany({
            data: Array.from(new Set(snapshot.tagIds)).map((tagId) => ({
              postId: id,
              tagId,
            })),
          })
        }
      }

      const updated = await tx.post.update({
        data: {
          category: snapshot.categoryId
            ? { connect: { id: snapshot.categoryId } }
            : { disconnect: true },
          content: snapshot.content as Prisma.InputJsonObject,
          contentText: snapshot.contentText ?? null,
          coverAlt: snapshot.coverAlt ?? null,
          coverUrl: snapshot.coverUrl ?? null,
          draftVisibility: snapshot.draftVisibility ?? "PRIVATE",
          excerpt: snapshot.excerpt ?? null,
          excerptContent:
            snapshot.excerptContent === null ||
            snapshot.excerptContent === undefined
              ? Prisma.JsonNull
              : (snapshot.excerptContent as Prisma.InputJsonObject),
          lastSavedAt: new Date(),
          moderationLockedAt: null,
          publishedAt: null,
          removedAt: null,
          removedFromStatus: null,
          status: "DRAFT",
          title: snapshot.title,
          version: { increment: 1 },
        },
        select: {
          id: true,
          lastSavedAt: true,
          slug: true,
          status: true,
          version: true,
        },
        where: { id, version: baseVersion },
      })

      const restoredSnapshot = {
        ...snapshot,
        authorId: post.authorId,
        publishedAt: null,
        removedAt: null,
        removedFromStatus: null,
        slug: updated.slug,
        status: "DRAFT",
        version: updated.version,
      } as PostRecoverySnapshot
      await tx.postRevision.create({
        data: {
          actorId: activeSession.user.id,
          checksum: getPostSnapshotChecksum(restoredSnapshot),
          kind: "RESTORE",
          postId: id,
          snapshot: restoredSnapshot as unknown as Prisma.InputJsonObject,
          sourceVersion: updated.version,
        },
        select: { id: true },
      })
      await tx.postAuditEvent.create({
        data: {
          action: "RESTORE",
          actorId: activeSession.user.id,
          metadata: { revisionId },
          postId: id,
          sourceVersion: updated.version,
        },
        select: { id: true },
      })

      return { data: updated } as const
    })

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status })
    }
    revalidatePostMutationPaths([result.data.slug])
    return Response.json({ data: result.data })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { error: "Post changed in another session. Your local copy was preserved." },
        { status: 409 },
      )
    }
    console.error("[POST /api/posts/[id]/revisions/[revisionId]/restore]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
