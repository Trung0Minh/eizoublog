"use client"

import { Archive, ArchiveRestore, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

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
  slug: string
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED"
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

  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AdminPost | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkActioning, setIsBulkActioning] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false)

  const keepStatusInCurrentFilter = (
    status: AdminPost["status"],
  ) => !currentStatus || currentStatus === status

  const removePostsLocally = (ids: Set<string>) => {
    setVisiblePosts((current) => current.filter((post) => !ids.has(post.id)))
  }

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

  async function handleBulkAction(action: "DELETE" | "ARCHIVE" | "UNARCHIVE") {
    if (selectedIds.size === 0) return
    setIsBulkActioning(true)
    try {
      const response = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, postIds: Array.from(selectedIds) }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        throw new Error(getApiError(result))
      }
      const selectedIdSnapshot = new Set(selectedIds)
      if (action === "DELETE") {
        removePostsLocally(selectedIdSnapshot)
      } else {
        updatePostStatusesLocally(
          selectedIdSnapshot,
          action === "ARCHIVE" ? "ARCHIVED" : "DRAFT",
        )
      }
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
      setBulkArchiveConfirm(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bulk action failed")
    } finally {
      setIsBulkActioning(false)
    }
  }

  async function handleArchive(post: AdminPost) {
    setArchivingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}/archive`, {
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      updatePostStatusesLocally(new Set([post.id]), "ARCHIVED")
      setArchiveTarget(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to archive post")
    } finally {
      setArchivingId(null)
    }
  }

  async function handleUnarchive(post: AdminPost) {
    setArchivingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}/archive`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      updatePostStatusesLocally(new Set([post.id]), "DRAFT")
      setArchiveTarget(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to restore post")
    } finally {
      setArchivingId(null)
    }
  }

  async function handleDelete(post: AdminPost) {
    setDeletingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      removePostsLocally(new Set([post.id]))
      setDeleteTarget(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setDeletingId(null)
    }
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
        No posts found for this filter.
      </div>
    )
  }

  const hasSelection = selectedIds.size > 0

  return (
    <>
      {hasSelection && (
        <div className="mb-4 flex items-center justify-between rounded-[8px] border border-border-default bg-subtle-bg px-4 py-2">
          <span className="text-[13px] font-medium text-text-secondary">
            {selectedIds.size} post{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isBulkActioning}
              onClick={() => handleBulkAction("UNARCHIVE")}
            >
              Restore
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isBulkActioning}
              onClick={() => setBulkArchiveConfirm(true)}
            >
              Archive
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isBulkActioning}
              onClick={() => setBulkDeleteConfirm(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-[8px] border border-border-default bg-background">
        <div className="min-w-[700px]">
          <div className="flex h-10 items-center border-b border-border-default bg-subtle-bg px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
            <div className="mr-4 flex shrink-0 items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
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
            <div className="w-[80px] shrink-0 text-right">Actions</div>
          </div>

          <div className="flex flex-col">
            {visiblePosts.map((post) => {
              const statusLabel =
                post.status === "PUBLISHED"
                  ? "Published"
                  : post.status === "ARCHIVED"
                    ? "Archived"
                    : "Draft"

              return (
                <div
                  className={`group flex h-[52px] items-center border-b border-border-default px-4 transition-colors last:border-0 hover:bg-subtle-bg ${selectedIds.has(post.id) ? "bg-subtle-bg" : ""}`}
                  key={post.id}
                >
                  <div className="mr-4 flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center pr-4">
                    <Link
                      className="block truncate text-[13px] font-medium text-text-primary transition-colors hover:text-accent"
                      href={`/dashboard/edit/${post.id}`}
                      prefetch={false}
                    >
                      {post.title}
                    </Link>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-text-tertiary">
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

                  <div className="w-[100px] shrink-0">
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

                  <div className="flex w-[80px] shrink-0 items-center justify-end gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    {post.status === "PUBLISHED" && (
                      <Button asChild className="h-7 w-7 p-0" size="sm" variant="ghost">
                        <Link aria-label="View post" href={`/${post.slug}`} prefetch={false}>
                          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      aria-label={
                        post.status === "ARCHIVED"
                          ? "Restore post to draft"
                          : "Archive post"
                      }
                      className="h-7 w-7 p-0 hover:text-orange-500"
                      disabled={archivingId === post.id}
                      onClick={() => setArchiveTarget(post)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {post.status === "ARCHIVED" ? (
                        <ArchiveRestore aria-hidden="true" className="h-3.5 w-3.5" />
                      ) : (
                        <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      aria-label="Delete post"
                      className="h-7 w-7 p-0 hover:text-accent"
                      disabled={deletingId === post.id}
                      onClick={() => setDeleteTarget(post)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <AdminConfirmModal
          body={
            <>
              This will permanently delete{" "}
              <span className="font-semibold text-text-primary">
                &quot;{deleteTarget.title}&quot;
              </span>
              . This action cannot be undone.
            </>
          }
          confirmLabel="Delete post"
          icon={<Trash2 aria-hidden="true" className="h-6 w-6 text-accent" />}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete(deleteTarget)}
          title="Delete post?"
          tone="delete"
        />
      )}

      {archiveTarget && (
        <AdminConfirmModal
          body={
            archiveTarget.status === "ARCHIVED" ? (
              <>
                This will restore{" "}
                <span className="font-semibold text-text-primary">
                  &quot;{archiveTarget.title}&quot;
                </span>
                . It will be moved back to draft.
              </>
            ) : (
              <>
                This will hide{" "}
                <span className="font-semibold text-text-primary">
                  &quot;{archiveTarget.title}&quot;
                </span>{" "}
                from public view. You can restore it anytime from the Archived
                filter.
              </>
            )
          }
          confirmLabel={archiveTarget.status === "ARCHIVED" ? "Restore post" : "Archive post"}
          icon={<Archive aria-hidden="true" className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() =>
            archiveTarget.status === "ARCHIVED"
              ? void handleUnarchive(archiveTarget)
              : void handleArchive(archiveTarget)
          }
          title={archiveTarget.status === "ARCHIVED" ? "Restore post?" : "Archive post?"}
          tone="archive"
        />
      )}
      {bulkDeleteConfirm && (
        <AdminConfirmModal
          body={
            <>
              This will permanently delete{" "}
              <span className="font-semibold text-text-primary">
                {selectedIds.size} post{selectedIds.size > 1 ? "s" : ""}
              </span>
              . This action cannot be undone.
            </>
          }
          confirmLabel={isBulkActioning ? "Deleting..." : "Delete posts"}
          icon={<Trash2 aria-hidden="true" className="h-6 w-6 text-accent" />}
          onCancel={() => setBulkDeleteConfirm(false)}
          onConfirm={() => void handleBulkAction("DELETE")}
          title="Delete selected posts?"
          tone="delete"
        />
      )}

      {bulkArchiveConfirm && (
        <AdminConfirmModal
          body={
            <>
              This will archive{" "}
              <span className="font-semibold text-text-primary">
                {selectedIds.size} post{selectedIds.size > 1 ? "s" : ""}
              </span>
              .
            </>
          }
          confirmLabel={isBulkActioning ? "Archiving..." : "Archive posts"}
          icon={<Archive aria-hidden="true" className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
          onCancel={() => setBulkArchiveConfirm(false)}
          onConfirm={() => void handleBulkAction("ARCHIVE")}
          title="Archive selected posts?"
          tone="archive"
        />
      )}
    </>
  )
}
