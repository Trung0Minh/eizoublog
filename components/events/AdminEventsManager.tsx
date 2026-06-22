"use client"

import type { AwardEventStatus } from "@prisma/client"
import { CalendarPlus, Settings2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AdminEventItem {
  _count: { rooms: number }
  createdAt: Date
  id: string
  publishedAt: Date | null
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
    case "ARCHIVED":
      return "Archived"
    case "CLOSED":
      return "Closed"
    case "DRAFT":
      return "Draft"
    case "OPEN":
      return "Open"
    case "PUBLISHED":
      return "Published"
  }
}

function statusClass(status: AwardEventStatus) {
  switch (status) {
    case "OPEN":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "PUBLISHED":
      return "border-accent/30 bg-accent/10 text-accent"
    case "CLOSED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "ARCHIVED":
      return "border-border-default bg-subtle-bg text-text-tertiary"
    case "DRAFT":
      return "border-border-default bg-background text-text-secondary"
  }
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
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [title, setTitle] = useState("")

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

      setTitle("")
      setCategoryId("")
      setSelectedTagIds([])
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create event")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md shadow-sm">
        {events.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-text-tertiary">
            No writing events yet.
          </div>
        ) : (
          events.map((event) => (
            <article
              className="group flex flex-col gap-4 border-b border-border-default p-6 last:border-0 sm:flex-row sm:items-center sm:justify-between hover:bg-accent/5 transition-colors"
              key={event.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[15px] font-semibold text-text-primary">
                    {event.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      statusClass(event.status),
                    )}
                  >
                    {statusLabel(event.status)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-text-tertiary">
                  {event._count.rooms} rooms · /{event.slug}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/events/${event.id}`} prefetch={false}>
                  <Settings2 aria-hidden="true" className="mr-2 h-4 w-4" />
                  Manage
                </Link>
              </Button>
            </article>
          ))
        )}
      </section>

      <aside className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarPlus aria-hidden="true" className="h-4 w-4 text-accent" />
          <h2 className="text-[15px] font-semibold text-text-primary">
            Open a new event
          </h2>
        </div>
        {error && (
          <div className="mb-3 rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <Input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sakuga Awards 2026"
            value={title}
          />
          <select
            className="h-10 w-full rounded-[5px] border border-border-default bg-background px-3 text-[13px]"
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
          <select
            className="min-h-24 w-full rounded-[5px] border border-border-default bg-background px-3 py-2 text-[13px]"
            multiple
            onChange={(event) =>
              setSelectedTagIds(
                Array.from(event.currentTarget.selectedOptions).map(
                  (option) => option.value,
                ),
              )
            }
            value={selectedTagIds}
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            disabled={isPending || title.trim().length === 0}
            onClick={() => void createEvent()}
            type="button"
          >
            Create event
          </Button>
        </div>
      </aside>
    </div>
  )
}
