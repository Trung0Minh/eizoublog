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

      <div className="w-full overflow-x-auto pb-4 px-2">
        <div className="min-w-[750px] flex flex-col gap-2">
          <div className="flex h-10 items-center px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
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
                    : "Draft"

              return (
                <div
                  className={`group relative flex items-center rounded-[20px] border border-transparent bg-subtle-bg/20 p-4 pl-6 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 ${selectedIds.has(post.id) ? "border-accent/30 bg-accent/5 ring-1 ring-accent/20" : ""} animate-in fade-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  key={post.id}
                >
                  <div className="mr-4 flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent accent-accent cursor-pointer"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center pr-4">
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

                  {/* Spacer for absolute actions to match header layout */}
                  <div className="w-[80px] shrink-0" />

                  <div className="absolute right-6 flex items-center justify-end gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-background/90 backdrop-blur-md rounded-[12px] shadow-sm border border-border-default/50 p-1.5 translate-x-4 group-hover:translate-x-0">
                    {post.status === "PUBLISHED" && (
                      <Button asChild className="h-8 w-8 rounded-[8px] p-0 hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors" size="sm" variant="ghost">
                        <Link aria-label="View post" href={`/${post.slug}`} prefetch={false}>
                          <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      aria-label={
                        post.status === "ARCHIVED"
                          ? "Restore post to draft"
                          : "Archive post"
                      }
                      className="h-8 w-8 rounded-[8px] p-0 hover:bg-orange-500/10 text-text-secondary hover:text-orange-500 transition-colors"
                      disabled={archivingId === post.id}
                      onClick={() => setArchiveTarget(post)}
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
                    <Button
                      aria-label="Delete post"
                      className="h-8 w-8 rounded-[8px] p-0 hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                      disabled={deletingId === post.id}
                      onClick={() => setDeleteTarget(post)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
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
