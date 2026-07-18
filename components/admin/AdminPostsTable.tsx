"use client"

import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  RotateCcw,
  Send,
  ShieldX,
  Trash2,
  Undo2,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import {
  AdminConfirmModal,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface AdminPost {
  _count: { comments: number }
  author: { name: string; username: string }
  id: string
  publishedAt: Date | null
  removedAt?: Date | null
  slug: string
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED" | "REMOVED"
  title: string
  updatedAt: Date
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

function getBulkUpdates(value: unknown): Array<{
  id: string
  status: AdminPost["status"]
}> | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("posts" in value.data) ||
    !Array.isArray(value.data.posts)
  ) {
    return null
  }

  const updates = value.data.posts.flatMap((post) => {
    if (
      typeof post !== "object" ||
      post === null ||
      !("id" in post) ||
      !("status" in post) ||
      typeof post.id !== "string" ||
      (post.status !== "DRAFT" &&
        post.status !== "PUBLISHED" &&
        post.status !== "ARCHIVED" &&
        post.status !== "REMOVED")
    ) {
      return []
    }

    return [{ id: post.id, status: post.status }]
  })

  return updates.length === value.data.posts.length ? updates : null
}

export function AdminPostsTable({ posts }: { posts: AdminPost[] }) {
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "latest"
  const currentStatus = searchParams.get("status")
  const [visiblePosts, setVisiblePosts] = useState(posts)

  const createSortLink = (sortType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortType === "latest") {
      params.delete("sort")
    } else {
      params.set("sort", sortType)
    }
    return `/admin/posts?${params.toString()}`
  }

  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [moderationReason, setModerationReason] = useState("")
  const [moderationTarget, setModerationTarget] = useState<{
    action: "ARCHIVE" | "PUBLISH" | "REMOVE" | "RESTORE_ARCHIVED" | "RESTORE_REMOVED" | "UNPUBLISH"
    post: AdminPost
  } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkActioning, setIsBulkActioning] = useState(false)
  const [bulkAction, setBulkAction] = useState<"ARCHIVE" | "REMOVE" | "RESTORE" | null>(null)
  const [bulkReason, setBulkReason] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentTime] = useState(() => Date.now())

  const keepStatusInCurrentFilter = (
    status: AdminPost["status"],
  ) => !currentStatus || currentStatus === status

  const updatePostStatusesLocally = (
    ids: Set<string>,
    status: AdminPost["status"],
  ) => {
    setVisiblePosts((current) =>
      current
        .map((post) => (ids.has(post.id) ? { ...post, status } : post))
        .filter((post) => keepStatusInCurrentFilter(post.status)),
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === visiblePosts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visiblePosts.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  async function handleBulkAction() {
    if (selectedIds.size === 0 || !bulkAction || bulkReason.trim().length < 3) return
    setIsBulkActioning(true)
    try {
      const response = await fetch("/api/posts/bulk", {
        body: JSON.stringify({
          action: bulkAction,
          postIds: Array.from(selectedIds),
          reason: bulkReason.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()
      if (!response.ok) throw new Error(getApiError(result))

      const updates = getBulkUpdates(result)
      if (!updates) throw new Error("Invalid bulk moderation response")
      const updatesById = new Map(updates.map((update) => [update.id, update.status]))
      setVisiblePosts((current) =>
        current
          .map((post) => {
            const status = updatesById.get(post.id)
            return status ? { ...post, status } : post
          })
          .filter((post) => keepStatusInCurrentFilter(post.status)),
      )
      setSelectedIds(new Set())
      setBulkAction(null)
      setBulkReason("")
      toast.success("Selected posts updated")
    } catch (error) {
      toast.error("Bulk action failed", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsBulkActioning(false)
    }
  }

  function openModeration(
    post: AdminPost,
    action: NonNullable<typeof moderationTarget>["action"],
  ) {
    setModerationReason("")
    setModerationTarget({ action, post })
  }

  function openPermanentDelete(post: AdminPost) {
    setDeleteConfirmation("")
    setDeleteTarget(post)
  }

  function canPurgeByAge(post: AdminPost) {
    return Boolean(
      post.removedAt &&
      currentTime - new Date(post.removedAt).getTime() >= 90 * 24 * 60 * 60 * 1000,
    )
  }

  async function handlePermanentDelete() {
    if (!deleteTarget || deleteConfirmation !== deleteTarget.title) return

    setDeletingId(deleteTarget.id)
    try {
      const response = await fetch(`/api/posts/${deleteTarget.id}`, {
        body: JSON.stringify({ confirmation: deleteConfirmation }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) throw new Error(getApiError(result))

      setVisiblePosts((current) =>
        current.filter((post) => post.id !== deleteTarget.id),
      )
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(deleteTarget.id)
        return next
      })
      toast.success("Post permanently deleted", {
        description: deleteTarget.title,
      })
      setDeleteTarget(null)
      setDeleteConfirmation("")
    } catch (error) {
      toast.error("Permanent deletion failed", {
        description:
          error instanceof Error ? error.message : deleteTarget.title,
      })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleModeration() {
    if (!moderationTarget || moderationReason.trim().length < 3) return
    const { action, post } = moderationTarget
    setModeratingId(post.id)
    try {
      const response = await fetch(`/api/admin/posts/${post.id}/moderation`, {
        body: JSON.stringify({ action, reason: moderationReason.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const fallbackStatus: AdminPost["status"] =
        action === "PUBLISH"
          ? "PUBLISHED"
          : action === "ARCHIVE"
            ? "ARCHIVED"
            : action === "REMOVE"
              ? "REMOVED"
              : "DRAFT"
      const nextStatus =
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data !== null &&
        "status" in result.data &&
        (result.data.status === "DRAFT" ||
          result.data.status === "PUBLISHED" ||
          result.data.status === "ARCHIVED" ||
          result.data.status === "REMOVED")
          ? result.data.status
          : fallbackStatus
      updatePostStatusesLocally(new Set([post.id]), nextStatus)
      setModerationTarget(null)
      setModerationReason("")
      toast.success("Post moderation updated", { description: post.title })
    } catch (error) {
      toast.error("Failed to update post", {
        description: error instanceof Error ? error.message : post.title,
      })
    } finally {
      setModeratingId(null)
    }
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-8 text-center text-sm text-text-tertiary">
        No posts found for this filter.
      </div>
    )
  }

  const hasSelection = selectedIds.size > 0

  return (
    <>
      {hasSelection && (
        <div className="mb-6 flex items-center justify-between rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md px-6 py-3 shadow-sm">
          <span className="text-[13px] font-medium text-text-secondary">
            {selectedIds.size} post{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              aria-label="Restore selected posts"
              size="icon"
              title="Restore selected posts"
              variant="outline"
              disabled={isBulkActioning}
              onClick={() => {
                setBulkReason("")
                setBulkAction("RESTORE")
              }}
            >
              <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Archive selected posts"
              size="icon"
              title="Archive selected posts"
              variant="outline"
              disabled={isBulkActioning}
              onClick={() => {
                setBulkReason("")
                setBulkAction("ARCHIVE")
              }}
            >
              <Archive aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Take down selected posts"
              size="icon"
              title="Take down selected posts"
              variant="destructive"
              disabled={isBulkActioning}
              onClick={() => {
                setBulkReason("")
                setBulkAction("REMOVE")
              }}
            >
              <ShieldX aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="w-full px-0 pb-4 sm:px-2 md:overflow-x-auto">
        <div className="flex min-w-0 flex-col gap-2 md:min-w-[750px]" data-testid="admin-posts-list">
          <div className="hidden h-10 items-center px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary md:flex">
            <div className="mr-4 flex shrink-0 items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent accent-accent cursor-pointer"
                checked={selectedIds.size === visiblePosts.length && visiblePosts.length > 0}
                onChange={toggleSelectAll}
              />
            </div>
            <div className="min-w-0 flex-1 pr-4">Title</div>
            <div className="hidden w-[140px] shrink-0 md:block">Author</div>
            <div className="w-[100px] shrink-0">Status</div>
            <Link 
              href={createSortLink(currentSort === "oldest" ? "latest" : "oldest")}
              className="hidden w-[120px] shrink-0 lg:flex items-center gap-1 hover:text-text-primary transition-colors cursor-pointer"
            >
              Date
              {currentSort === "oldest" ? " ↑" : " ↓"}
            </Link>
            <Link 
              href={createSortLink(currentSort === "comments" ? "latest" : "comments")}
              className="hidden w-[80px] shrink-0 lg:flex items-center justify-end gap-1 hover:text-text-primary transition-colors cursor-pointer"
            >
              Comments
              {currentSort === "comments" && " ↓"}
            </Link>
            <div className="w-[80px] shrink-0 text-right opacity-0">Actions</div>
          </div>

          <div className="flex flex-col gap-3">
            {visiblePosts.map((post, index) => {
              const statusLabel =
                post.status === "PUBLISHED"
                  ? "Published"
                  : post.status === "ARCHIVED"
                    ? "Archived"
                    : post.status === "REMOVED"
                      ? "Removed"
                    : "Draft"

              return (
                <div
                  className={`group relative flex flex-col items-stretch rounded-[20px] border border-transparent bg-subtle-bg/20 p-4 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 md:flex-row md:items-center md:pl-6 ${selectedIds.has(post.id) ? "border-accent/30 bg-accent/5 ring-1 ring-accent/20" : ""} animate-in fade-in slide-in-from-bottom-2`}
                  data-testid={`admin-post-row-${post.id}`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  key={post.id}
                >
                  <div className="absolute left-4 top-4 flex shrink-0 items-center md:static md:mr-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent accent-accent cursor-pointer"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center pl-8 pr-24 md:pl-0 md:pr-4">
                    <Link
                      className="block truncate text-[14px] font-bold text-text-primary transition-colors group-hover:text-accent"
                      href={`/dashboard/edit/${post.id}`}
                      prefetch={false}
                    >
                      {post.title}
                    </Link>
                    <div className="mt-1 truncate font-mono text-[11px] text-text-tertiary">
                      /{post.slug}
                    </div>
                  </div>

                  <div className="hidden w-[140px] shrink-0 items-center gap-2 md:flex">
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#0d9488] text-[10px] font-semibold text-white">
                      {post.author.name.charAt(0)}
                    </div>
                    <span className="truncate text-[12px] text-text-secondary">
                      {post.author.name}
                    </span>
                  </div>

                  <div className="absolute right-4 top-4 w-fit shrink-0 md:static md:ml-0 md:mt-0 md:w-[100px]">
                    <AdminStatusBadge status={statusLabel} />
                  </div>

                  <div className="hidden w-[120px] shrink-0 text-[12px] text-text-secondary lg:block">
                    {post.status === "DRAFT"
                      ? `Updated ${formatDate(post.updatedAt)}`
                      : formatDate(post.publishedAt ?? post.updatedAt)}
                  </div>

                  <div className="hidden w-[80px] shrink-0 text-right text-[12px] font-medium text-text-secondary lg:block">
                    {post._count.comments}
                  </div>

                  {/* Spacer for absolute actions to match header layout */}
                  <div className="hidden w-[80px] shrink-0 md:block" />

                  <div className="ml-8 mt-3 flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-1 rounded-[12px] border border-border-default/50 bg-background/90 p-1.5 opacity-100 shadow-sm backdrop-blur-md transition-all duration-300 md:absolute md:right-6 md:ml-0 md:mt-0 md:max-w-none md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                    {post.status === "PUBLISHED" && (
                      <Button asChild className="h-8 w-8 rounded-[8px] p-0 hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors" size="sm" variant="ghost">
                        <Link aria-label="View post" href={`/${post.slug}`} prefetch={false}>
                          <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {post.status === "PUBLISHED" && (
                      <Button
                        aria-label="Unpublish post"
                        className="h-8 w-8 rounded-[8px] p-0 text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
                        disabled={moderatingId === post.id}
                        onClick={() => openModeration(post, "UNPUBLISH")}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <RotateCcw aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    )}
                    {post.status === "DRAFT" && (
                      <Button
                        aria-label="Publish post"
                        className="h-8 w-8 rounded-[8px] p-0 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                        disabled={moderatingId === post.id}
                        onClick={() => openModeration(post, "PUBLISH")}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Send aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    )}
                    {post.status === "REMOVED" ? (
                      <>
                        <Button
                          aria-label="Restore removed post"
                          className="h-8 w-8 rounded-[8px] p-0 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                          disabled={moderatingId === post.id || deletingId === post.id}
                          onClick={() => openModeration(post, "RESTORE_REMOVED")}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Undo2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          aria-label="Permanently delete post"
                          className="h-8 w-8 rounded-[8px] p-0 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                          disabled={
                            deletingId === post.id ||
                            moderatingId === post.id ||
                            !canPurgeByAge(post)
                          }
                          onClick={() => openPermanentDelete(post)}
                          size="sm"
                          title={
                            canPurgeByAge(post)
                              ? "Permanently delete post"
                              : "Available 90 days after removal"
                          }
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                    <Button
                      aria-label={
                        post.status === "ARCHIVED"
                          ? "Restore post to draft"
                          : "Archive post"
                      }
                      className="h-8 w-8 rounded-[8px] p-0 hover:bg-orange-500/10 text-text-secondary hover:text-orange-500 transition-colors"
                      disabled={moderatingId === post.id}
                      onClick={() =>
                        openModeration(
                          post,
                          post.status === "ARCHIVED"
                            ? "RESTORE_ARCHIVED"
                            : "ARCHIVE",
                        )
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {post.status === "ARCHIVED" ? (
                        <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Archive aria-hidden="true" className="h-4 w-4" />
                      )}
                    </Button>
                    )}
                    {post.status !== "REMOVED" && (
                    <Button
                      aria-label="Take down post"
                      className="h-8 w-8 rounded-[8px] p-0 hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                      disabled={moderatingId === post.id}
                      onClick={() => openModeration(post, "REMOVE")}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ShieldX aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {moderationTarget && (
        <AdminConfirmModal
          body={
            <>
              Apply this moderation action to{" "}
              <span className="font-semibold text-text-primary">
                &quot;{moderationTarget.post.title}&quot;
              </span>
              . The author will receive your reason.
            </>
          }
          confirmDisabled={moderationReason.trim().length < 3 || moderatingId !== null}
          confirmLabel={
            moderationTarget.action === "UNPUBLISH"
              ? "Unpublish"
              : moderationTarget.action === "PUBLISH"
                ? "Publish"
                : moderationTarget.action === "ARCHIVE"
                  ? "Archive post"
                  : moderationTarget.action === "REMOVE"
                    ? "Take down post"
                    : "Restore post"
          }
          icon={
            moderationTarget.action === "REMOVE" ? (
              <ShieldX aria-hidden="true" className="h-6 w-6 text-accent" />
            ) : (
              <Archive aria-hidden="true" className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            )
          }
          onCancel={() => {
            setModerationTarget(null)
            setModerationReason("")
          }}
          onConfirm={() => void handleModeration()}
          onReasonChange={setModerationReason}
          reason={moderationReason}
          title={
            moderationTarget.action === "UNPUBLISH"
              ? "Unpublish post?"
              : moderationTarget.action === "PUBLISH"
                ? "Publish post?"
                : moderationTarget.action === "ARCHIVE"
                  ? "Archive post?"
                  : moderationTarget.action === "REMOVE"
                    ? "Take down post?"
                    : "Restore post?"
          }
          tone={moderationTarget.action === "REMOVE" ? "delete" : "archive"}
        />
      )}
      {deleteTarget && (
        <AdminConfirmModal
          body={
            <div className="space-y-5">
              <p>
                This permanently deletes the post after its 90-day recovery
                window. The action remains blocked unless a verified backup was
                created after removal. Media cleanup runs safely after the
                database transaction.
              </p>
              {deleteTarget.removedAt && (
                <p className="text-[12px] text-text-secondary">
                  Removed {formatDate(deleteTarget.removedAt)}.
                </p>
              )}
              <label className="block text-[12px] font-semibold text-text-primary">
                Type the post title to confirm
                <span className="mt-1.5 block break-words rounded-[10px] border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[12px] font-medium text-destructive">
                  {deleteTarget.title}
                </span>
                <input
                  aria-label="Type the post title to confirm"
                  autoComplete="off"
                  autoFocus
                  className="mt-2 h-10 w-full rounded-[12px] border border-border-strong bg-subtle-bg px-3 text-[13px] font-normal text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder="Enter the exact title"
                  spellCheck={false}
                  value={deleteConfirmation}
                />
              </label>
            </div>
          }
          confirmDisabled={
            deleteConfirmation !== deleteTarget.title || deletingId !== null
          }
          confirmLabel={deletingId ? "Deleting…" : "Permanently delete"}
          icon={<Trash2 aria-hidden="true" className="h-6 w-6 text-destructive" />}
          onCancel={() => {
            if (deletingId) return
            setDeleteTarget(null)
            setDeleteConfirmation("")
          }}
          onConfirm={() => void handlePermanentDelete()}
          title="Permanently delete this post?"
          tone="delete"
        />
      )}
      {bulkAction && (
        <AdminConfirmModal
          body={
            <>
              This will {bulkAction.toLowerCase()}{" "}
              <span className="font-semibold text-text-primary">
                {selectedIds.size} post{selectedIds.size > 1 ? "s" : ""}
              </span>
              . Each primary author will receive this reason.
            </>
          }
          confirmDisabled={bulkReason.trim().length < 3 || isBulkActioning}
          confirmLabel={isBulkActioning ? "Updating…" : `${bulkAction === "RESTORE" ? "Restore" : bulkAction === "REMOVE" ? "Take down" : "Archive"} posts`}
          icon={bulkAction === "REMOVE" ? <ShieldX aria-hidden="true" className="h-6 w-6 text-accent" /> : <Archive aria-hidden="true" className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
          onCancel={() => {
            setBulkAction(null)
            setBulkReason("")
          }}
          onConfirm={() => void handleBulkAction()}
          onReasonChange={setBulkReason}
          reason={bulkReason}
          title={`${bulkAction === "RESTORE" ? "Restore" : bulkAction === "REMOVE" ? "Take down" : "Archive"} selected posts?`}
          tone={bulkAction === "REMOVE" ? "delete" : "archive"}
        />
      )}
    </>
  )
}
