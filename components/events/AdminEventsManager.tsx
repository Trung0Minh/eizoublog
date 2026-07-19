"use client"

import type { AwardEventStatus } from "@prisma/client"
import { CalendarPlus, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AdminEventItem {
  _count: { rooms: number }
  createdAt: Date
  id: string
  finalPost: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED" } | null
  slug: string
  status: AwardEventStatus
  title: string
  updatedAt: Date
}

interface CategoryOption {
  id: string
  name: string
}

interface TagOption {
  id: string
  name: string
}

type AdminArticleStatus = NonNullable<AdminEventItem["finalPost"]>["status"]

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

function statusLabel(status: AwardEventStatus) {
  switch (status) {
    case "CLOSED":
      return "Closed"
    case "OPEN":
      return "Open"
  }
}

function statusClass(status: AwardEventStatus) {
  switch (status) {
    case "OPEN":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "CLOSED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }
}

function articleStatusLabel(status: AdminArticleStatus | undefined) {
  if (status === "PUBLISHED") return "Published"
  if (status === "REMOVED") return "Removed"
  if (status === "ARCHIVED") return "Archived"
  return "Unpublished"
}

function articleStatusClass(status: AdminArticleStatus | undefined) {
  if (status === "PUBLISHED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }
  if (status === "REMOVED") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }
  if (status === "ARCHIVED") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }
  return "border-border-default bg-subtle-bg text-text-tertiary"
}

export function AdminEventsManager({
  categories,
  events,
  tags,
}: {
  categories: CategoryOption[]
  events: AdminEventItem[]
  tags: TagOption[]
}) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminEventItem | null>(null)
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [title, setTitle] = useState("")

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  function resetForm() {
    setTitle("")
    setCategoryId("")
    setSelectedTagIds([])
    setError("")
    setIsModalOpen(false)
  }

  async function createEvent() {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch("/api/admin/events", {
        body: JSON.stringify({
          categoryId: categoryId || undefined,
          tagIds: selectedTagIds,
          title,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      resetForm()
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create event")
    } finally {
      setIsPending(false)
    }
  }

  async function deleteEvent() {
    if (!deleteTarget) return

    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/events/${deleteTarget.id}`, {
        body: JSON.stringify({ confirmation: deleteTarget.title }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setDeleteTarget(null)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete event")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] border border-border-default/50 bg-background/95 backdrop-blur-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={resetForm}
              className="absolute right-6 top-6 rounded-full p-1.5 text-text-secondary hover:bg-subtle-bg hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5"/>
            </button>

            {error && (
              <div className="mb-6 rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive shadow-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h2 className="text-[18px] font-bold text-text-primary">
                  Open a new event
                </h2>
                <p className="mt-1 text-[13px] text-text-tertiary">
                  Create a new annual writing event and assign its category.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="event-title">
                  Event Title
                </label>
                <Input
                  id="event-title"
                  maxLength={100}
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                  className="h-11 rounded-[12px] border-border-default/60 bg-subtle-bg/30 px-4 focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all text-[14px]"
                  placeholder="e.g. Sakuga Awards 2026"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="event-category">
                  Category
                </label>
                <select
                  className="h-11 w-full rounded-[12px] border border-border-default/60 bg-subtle-bg/30 px-4 text-[14px] text-text-primary outline-none focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all appearance-none cursor-pointer"
                  id="event-category"
                  onChange={(event) => setCategoryId(event.target.value)}
                  value={categoryId}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1">
                  Tags
                </label>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-[12px] border border-border-default/60 bg-subtle-bg/20 p-3">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 border",
                          isSelected
                            ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                            : "border-border-default/60 bg-background text-text-secondary hover:border-accent/40 hover:text-accent"
                        )}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {tags.length === 0 && (
                    <div className="w-full text-center text-[12px] text-text-tertiary py-2">
                      No tags available.
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full h-11 rounded-[12px] bg-accent font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] hover:shadow-accent/40 mt-4"
                disabled={isPending || !title.trim()}
                onClick={() => void createEvent()}
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create event
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-text-primary">All Events</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-10 rounded-full bg-accent p-0 font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40"
          aria-label="Add event"
          title="Add event"
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-12 text-center text-[14px] text-text-tertiary">
            No writing events yet. Click &quot;Add Event&quot; to start one!
          </div>
        ) : (
          events.map((event, index) => (
            <article
              className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[24px] border border-transparent bg-subtle-bg/30 p-5 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
              key={event.id}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="min-w-0 truncate text-[16px] font-bold">
                    <Link
                      className="rounded-sm text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      href={`/admin/events/${event.id}`}
                    >
                      {event.title}
                    </Link>
                  </h2>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase shadow-sm",
                      statusClass(event.status),
                    )}
                  >
                    {statusLabel(event.status)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      articleStatusClass(event.finalPost?.status),
                    )}
                  >
                    {articleStatusLabel(event.finalPost?.status)}
                  </span>
                </div>
                <p className="mt-1.5 flex items-center gap-2 text-[13px] font-medium text-text-secondary">
                  <span className="flex items-center gap-1.5 rounded-full bg-background/50 px-2 py-0.5 border border-border-default/50">
                    <CalendarPlus className="h-3 w-3 text-accent" />
                    {event._count.rooms} rooms
                  </span>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono text-[11.5px] text-text-tertiary">/{event.slug}</span>
                </p>
              </div>
              <Button
                aria-label={`Delete ${event.title}`}
                className="h-9 w-9 shrink-0 rounded-full text-text-tertiary hover:bg-destructive/10 hover:text-destructive"
                disabled={isPending}
                onClick={() => setDeleteTarget(event)}
                size="icon"
                title={`Delete ${event.title}`}
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            </article>
          ))
        )}
      </div>

      <ConfirmationDialog
        key={deleteTarget?.id ?? "delete-event"}
        confirmLabel="Delete event"
        confirmationText={deleteTarget?.title}
        description={
          <>
            Delete <strong className="text-text-primary">{deleteTarget?.title}</strong>,
            all participant rooms, feedback, and its generated article permanently.
            Writers&apos; source posts are not affected.
          </>
        }
        icon={Trash2}
        onConfirm={() => void deleteEvent()}
        onOpenChange={(open) => {
          if (!open && !isPending) setDeleteTarget(null)
        }}
        open={Boolean(deleteTarget)}
        pending={isPending}
        title="Delete event?"
        tone="destructive"
      />
    </div>
  )
}
