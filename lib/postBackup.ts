import { z } from "zod"

import {
  MAX_POST_CONTENT_BYTES,
  MAX_POST_TEXT_CHARACTERS,
  validatePostContentSize,
} from "@/lib/postDurability"
import { MAX_POST_EXCERPT_CHARACTERS } from "@/lib/postLimits"

export const MAX_POST_BACKUP_BYTES = MAX_POST_CONTENT_BYTES + 1024 * 1024

const jsonObjectSchema = z.record(z.string(), z.unknown())
const referenceSchema = z.object({
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
})

const backupPostSchema = z.object({
  category: referenceSchema.nullable().optional(),
  categoryId: z.string().trim().min(1).optional(),
  content: jsonObjectSchema,
  contentText: z.string().max(MAX_POST_TEXT_CHARACTERS).nullable().optional(),
  coverAlt: z.string().max(200).nullable().optional(),
  coverUrl: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "Cover URL must use HTTP or HTTPS")
    .nullable()
    .optional(),
  excerpt: z.string().max(MAX_POST_EXCERPT_CHARACTERS).nullable().optional(),
  excerptContent: jsonObjectSchema.nullable().optional(),
  tags: z.array(z.unknown()).max(100).optional(),
  title: z.string().max(200).optional(),
})

const backupEnvelopeSchema = z.object({
  data: z.object({
    formatVersion: z.literal(1),
    post: backupPostSchema,
  }),
})

export interface PostBackupReference {
  id?: string
  slug?: string
}

export interface NormalizedPostBackup {
  category: PostBackupReference | null
  content: Record<string, unknown>
  contentText: string | null
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  excerptContent: Record<string, unknown> | null
  tags: PostBackupReference[]
  title: string | null
}

function readTagReference(value: unknown): PostBackupReference | null {
  const candidate =
    typeof value === "object" && value !== null && "tag" in value
      ? value.tag
      : value
  const parsed = referenceSchema.safeParse(candidate)
  if (!parsed.success || (!parsed.data.id && !parsed.data.slug)) return null
  return parsed.data
}

export function parsePostBackup(value: unknown): NormalizedPostBackup {
  const envelope = backupEnvelopeSchema.parse(value)
  const post = envelope.data.post
  const sizeError = validatePostContentSize({
    content: post.content,
    contentText: post.contentText ?? undefined,
  })
  if (sizeError) throw new Error(sizeError)

  const category = post.category ?? (post.categoryId ? { id: post.categoryId } : null)

  return {
    category:
      category && (category.id || category.slug) ? category : null,
    content: post.content,
    contentText: post.contentText?.trim() || null,
    coverAlt: post.coverAlt?.trim() || null,
    coverUrl: post.coverUrl || null,
    excerpt: post.excerpt?.trim() || null,
    excerptContent: post.excerptContent ?? null,
    tags: Array.from(
      new Map(
        (post.tags ?? [])
          .map(readTagReference)
          .filter((tag): tag is PostBackupReference => tag !== null)
          .map((tag) => [`${tag.slug ?? ""}:${tag.id ?? ""}`, tag]),
      ).values(),
    ),
    title: post.title?.trim() || null,
  }
}
