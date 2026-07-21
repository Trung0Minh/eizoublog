import { createHash } from "node:crypto"

import type { Prisma } from "@prisma/client"

export const MAX_POST_CONTENT_BYTES = 5 * 1024 * 1024
export const MAX_POST_TEXT_CHARACTERS = 1_000_000

export interface PostRecoverySnapshot {
  authorId: string
  categoryId: string | null
  coAuthorIds: string[]
  content: Prisma.JsonValue
  contentText: string | null
  coverAlt: string | null
  coverUrl: string | null
  draftVisibility: "PRIVATE" | "CO_AUTHORS"
  excerpt: string | null
  excerptContent: Prisma.JsonValue | null
  publishedAt: string | null
  removedAt: string | null
  removedFromStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED" | null
  slug: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED"
  tagIds: string[]
  title: string
  version: number
}

export function getPostSnapshotChecksum(snapshot: PostRecoverySnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
}

export function validatePostContentSize({
  content,
  contentText,
}: {
  content?: unknown
  contentText?: string
}) {
  if (
    content !== undefined &&
    Buffer.byteLength(JSON.stringify(content), "utf8") > MAX_POST_CONTENT_BYTES
  ) {
    return "Post content is too large"
  }

  if (
    contentText !== undefined &&
    contentText.length > MAX_POST_TEXT_CHARACTERS
  ) {
    return "Post text is too large"
  }

  return null
}
