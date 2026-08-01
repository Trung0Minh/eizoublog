import type { PostStatus } from "@prisma/client"

export type PostModerationAction =
  | "ARCHIVE"
  | "PUBLISH"
  | "REMOVE"
  | "RESTORE_ARCHIVED"
  | "RESTORE_REMOVED"
  | "UNPUBLISH"

export interface PostModerationTransition {
  moderationLockedAt: Date | null
  publishedAt: Date | null
  removedAt: Date | null | undefined
  removedFromStatus: PostStatus | null
  toStatus: PostStatus
}

export class PostModerationTransitionError extends Error {}

export function getPostModerationTransition(
  action: PostModerationAction,
  post: {
    removedFromStatus: PostStatus | null
    status: PostStatus
  },
): PostModerationTransition {
  const now = new Date()

  if (action === "UNPUBLISH" && post.status === "PUBLISHED") {
    return {
      moderationLockedAt: null,
      publishedAt: null,
      removedAt: undefined,
      removedFromStatus: null,
      toStatus: "DRAFT",
    }
  }

  if (action === "PUBLISH" && post.status === "DRAFT") {
    return {
      moderationLockedAt: null,
      publishedAt: now,
      removedAt: undefined,
      removedFromStatus: null,
      toStatus: "PUBLISHED",
    }
  }

  if (
    action === "ARCHIVE" &&
    (post.status === "DRAFT" || post.status === "PUBLISHED")
  ) {
    return {
      moderationLockedAt: now,
      publishedAt: null,
      removedAt: undefined,
      removedFromStatus: null,
      toStatus: "ARCHIVED",
    }
  }

  if (action === "RESTORE_ARCHIVED" && post.status === "ARCHIVED") {
    return {
      moderationLockedAt: null,
      publishedAt: null,
      removedAt: undefined,
      removedFromStatus: null,
      toStatus: "DRAFT",
    }
  }

  if (action === "REMOVE" && post.status !== "REMOVED") {
    return {
      moderationLockedAt: now,
      publishedAt: null,
      removedAt: now,
      removedFromStatus: post.status,
      toStatus: "REMOVED",
    }
  }

  if (action === "RESTORE_REMOVED" && post.status === "REMOVED") {
    const restoredStatus = post.removedFromStatus ?? "DRAFT"
    return {
      moderationLockedAt: restoredStatus === "ARCHIVED" ? now : null,
      publishedAt: restoredStatus === "PUBLISHED" ? now : null,
      removedAt: null,
      removedFromStatus: null,
      toStatus: restoredStatus,
    }
  }

  throw new PostModerationTransitionError(
    "Action is not valid for the current post status",
  )
}
