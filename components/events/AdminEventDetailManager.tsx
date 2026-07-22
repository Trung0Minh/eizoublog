"use client"

import type {
  AwardEventRoomStatus,
  AwardEventStatus,
  PostStatus,
} from "@prisma/client"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  Shuffle,
  UserMinus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { reorderAwardEventRooms } from "@/lib/awardEvents"

interface AdminEventRoom {
  _count: { comments: number }
  excludedAt: Date | null
  id: string
  order: number
  postId: string | null
  selectedPost: {
    id: string
    status: PostStatus
    title: string
  } | null
  submittedPostId?: string | null
  submittedPostTitle?: string | null
  status: AwardEventRoomStatus
  updatedAt: Date
  visibility: "PRIVATE" | "PARTICIPANTS"
  writer: { name: string; role: "ADMIN" | "WRITER" | "REVOKED"; username: string }
}

interface AdminEventDetail {
  categoryId?: string | null
  coverAlt?: string | null
  coverUrl?: string | null
  finalPost: { slug: string; status: PostStatus } | null
  id: string
  introText: string | null
  rooms: AdminEventRoom[]
  status: AwardEventStatus
  tags?: Array<{ tag: { id: string; name: string } }>
  title: string
}

interface CategoryOption {
  id: string
  name: string
}

interface TagOption {
  id: string
  name: string
}

const ROOM_ORDER_SAVE_DELAY_MS = 350

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

function getShuffledRooms(value: unknown): Array<{ id: string; order: number }> {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("rooms" in value.data) ||
    !Array.isArray(value.data.rooms)
  ) {
    return []
  }

  return value.data.rooms.filter(
    (room): room is { id: string; order: number } =>
      typeof room === "object" &&
      room !== null &&
      "id" in room &&
      typeof room.id === "string" &&
      "order" in room &&
      typeof room.order === "number",
  )
}

function statusTone(status: AwardEventStatus) {
  switch (status) {
    case "OPEN":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
    case "CLOSED":
      return "border-border-default bg-subtle-bg text-text-tertiary shadow-sm"
  }
}

function articleStatusLabel(status: PostStatus | undefined) {
  if (status === "PUBLISHED") return "Published"
  if (status === "REMOVED") return "Removed"
  if (status === "ARCHIVED") return "Archived"
  return "Unpublished"
}

function articleStatusTone(status: PostStatus | undefined) {
  if (status === "PUBLISHED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-300"
  }
  if (status === "REMOVED") {
    return "border-destructive/30 bg-destructive/10 text-destructive shadow-sm"
  }
  if (status === "ARCHIVED") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-sm dark:text-amber-300"
  }
  return "border-border-default bg-subtle-bg text-text-tertiary shadow-sm"
}

const submissionCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args)
}

function SortableSubmission({
  children,
  className,
  disabled,
  id,
}: {
  children: (
    handle: Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">,
  ) => ReactNode
  className: string
  disabled: boolean
  id: string
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      disabled,
      id,
      transition: { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    })

  return (
    <article
      className={className}
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.18 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        willChange: transform ? "transform" : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      {children({ attributes, listeners })}
    </article>
  )
}

export function AdminEventDetailManager({
  categories = [],
  event,
  tags = [],
}: {
  categories?: CategoryOption[]
  event: AdminEventDetail
  tags?: TagOption[]
}) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(event.categoryId ?? "")
  const [coverAlt, setCoverAlt] = useState(event.coverAlt ?? "")
  const [coverUrl, setCoverUrl] = useState(event.coverUrl ?? "")
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [introText, setIntroText] = useState(event.introText ?? "")
  const [isPending, setIsPending] = useState(false)
  const [isRemovingRoom, setIsRemovingRoom] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminEventRoom | null>(null)
  const [rooms, setRooms] = useState(event.rooms)
  const [shuffleTurns, setShuffleTurns] = useState(0)
  const [title, setTitle] = useState(event.title)
  const [selectedTagIds, setSelectedTagIds] = useState(
    event.tags?.map(({ tag }) => tag.id) ?? [],
  )
  const pendingRoomOrderRef = useRef<Array<{ id: string; order: number }> | null>(null)
  const roomOrderSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roomOrderSaveRunningRef = useRef(false)
  const roomsRef = useRef(event.rooms)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const submittedRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          room.status === "SUBMITTED" &&
          !room.excludedAt &&
          (room.selectedPost || room.submittedPostId),
      ),
    [rooms],
  )

  async function patchEvent(
    body: object,
    options: { refreshOnSuccess?: boolean; rollbackRooms?: AdminEventRoom[] } = {},
  ) {
    setError("")
    setIsPending(true)
    const refreshOnSuccess = options.refreshOnSuccess ?? true

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      if (refreshOnSuccess) {
        router.refresh()
      }
    } catch (caughtError) {
      if (options.rollbackRooms) {
        setRooms(options.rollbackRooms)
      }
      setError(caughtError instanceof Error ? caughtError.message : "Event update failed")
    } finally {
      setIsPending(false)
    }
  }

  async function action(path: "publish" | "unpublish") {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/events/${event.id}/${path}`, {
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Action failed")
    } finally {
      setIsPending(false)
    }
  }

  async function flushRoomOrder() {
    if (roomOrderSaveRunningRef.current) return

    const roomOrder = pendingRoomOrderRef.current
    if (!roomOrder) {
      setIsSavingOrder(false)
      return
    }

    roomOrderSaveRunningRef.current = true
    pendingRoomOrderRef.current = null

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        body: JSON.stringify({ roomOrder }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Order update failed")
    } finally {
      roomOrderSaveRunningRef.current = false
      if (pendingRoomOrderRef.current) {
        scheduleRoomOrderSave()
      } else {
        setIsSavingOrder(false)
      }
    }
  }

  function scheduleRoomOrderSave() {
    if (roomOrderSaveTimerRef.current) {
      clearTimeout(roomOrderSaveTimerRef.current)
    }

    roomOrderSaveTimerRef.current = setTimeout(() => {
      roomOrderSaveTimerRef.current = null
      void flushRoomOrder()
    }, ROOM_ORDER_SAVE_DELAY_MS)
  }

  function queueRoomOrder(orderedRooms: AdminEventRoom[]) {
    setError("")
    setIsSavingOrder(true)
    pendingRoomOrderRef.current = orderedRooms.map(({ id, order }) => ({ id, order }))
    scheduleRoomOrderSave()
  }

  function updateRoomOrder(orderedRooms: AdminEventRoom[]) {
    roomsRef.current = orderedRooms
    setRooms(orderedRooms)
    queueRoomOrder(orderedRooms)
  }

  function shuffleRooms() {
    if (roomOrderSaveTimerRef.current) {
      clearTimeout(roomOrderSaveTimerRef.current)
      roomOrderSaveTimerRef.current = null
    }

    pendingRoomOrderRef.current = null
    roomOrderSaveRunningRef.current = false
    setIsSavingOrder(true)
    setError("")

    void (async () => {
      try {
        const response = await fetch(`/api/admin/events/${event.id}/shuffle`, {
          method: "POST",
        })
        const result: unknown = await response.json()

        if (!response.ok) {
          throw new Error(getApiError(result))
        }

        const shuffledRooms = getShuffledRooms(result)
        const orderById = new Map(shuffledRooms.map((room) => [room.id, room.order]))
        const nextRooms = [...roomsRef.current].sort(
          (a, b) =>
            (orderById.get(a.id) ?? a.order) - (orderById.get(b.id) ?? b.order),
        )

        const normalizedRooms = nextRooms.map((room, order) => ({
          ...room,
          order,
        }))

        roomsRef.current = normalizedRooms
        setRooms(normalizedRooms)
        setShuffleTurns((turns) => turns + 1)
        router.refresh()
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Shuffle failed")
      } finally {
        setIsSavingOrder(false)
      }
    })()
  }

  async function removeParticipant() {
    if (!removeTarget) return

    const previousRooms = roomsRef.current
    const nextRooms = previousRooms
      .filter((room) => room.id !== removeTarget.id)
      .map((room, order) => ({ ...room, order }))

    setError("")
    setIsRemovingRoom(true)
    roomsRef.current = nextRooms
    setRooms(nextRooms)

    try {
      const response = await fetch(
        `/api/admin/events/${event.id}/rooms/${removeTarget.id}`,
        { method: "DELETE" },
      )
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setRemoveTarget(null)
      router.refresh()
    } catch (caughtError) {
      roomsRef.current = previousRooms
      setRooms(previousRooms)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to remove participant",
      )
    } finally {
      setIsRemovingRoom(false)
    }
  }

  function reorderRoom(roomId: string, targetRoomId: string) {
    const currentRooms = roomsRef.current
    const currentIndex = currentRooms.findIndex((room) => room.id === roomId)
    const targetIndex = currentRooms.findIndex((room) => room.id === targetRoomId)

    if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) {
      return
    }

    updateRoomOrder(reorderAwardEventRooms(currentRooms, roomId, targetRoomId))
  }

  function handleDragStart(dragEvent: DragStartEvent) {
    setDraggingRoomId(String(dragEvent.active.id))
  }

  function handleDragEnd(dragEvent: DragEndEvent) {
    if (dragEvent.over && dragEvent.active.id !== dragEvent.over.id) {
      reorderRoom(String(dragEvent.active.id), String(dragEvent.over.id))
    }
    setDraggingRoomId(null)
  }

  function toggleRoomExclusion(roomId: string) {
    const previousRooms = rooms
    const room = rooms.find((candidate) => candidate.id === roomId)

    if (!room) return

    const excluded = !room.excludedAt
    setRooms((currentRooms) => {
      const updatedRooms = currentRooms.map((candidate) =>
        candidate.id === roomId
          ? { ...candidate, excludedAt: excluded ? new Date() : null }
          : candidate,
      )
      roomsRef.current = updatedRooms
      return updatedRooms
    })
    void patchEvent(
      { roomExclusion: { excluded, id: roomId } },
      { refreshOnSuccess: false, rollbackRooms: previousRooms },
    )
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="space-y-6" data-testid="event-article-settings-column">
      <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                  statusTone(event.status),
                )}
              >
                Event: {event.status}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  articleStatusTone(event.finalPost?.status),
                )}
              >
                {articleStatusLabel(event.finalPost?.status)}
              </span>
            </div>
            <p className="mt-3 text-[14px] font-medium text-text-secondary">
              <span className="font-bold text-text-primary">{submittedRooms.length}</span> submitted submissions are eligible for the final article.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() =>
                void patchEvent({ status: event.status === "OPEN" ? "CLOSED" : "OPEN" })
              }
              className="h-10 rounded-full font-semibold px-4 transition-all hover:scale-105"
              type="button"
              variant="outline"
            >
              {event.status === "OPEN" ? "Close event" : "Reopen event"}
            </Button>
            <Button asChild className="h-10 w-10 rounded-full p-0" variant="outline">
              <Link
                aria-label="Preview final event"
                href={`/admin/events/${event.id}/preview`}
                title="Preview final event"
              >
                <Eye aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                void action(event.finalPost?.status === "PUBLISHED" ? "unpublish" : "publish")
              }
              aria-label={event.finalPost?.status === "PUBLISHED" ? "Unpublish event article" : "Publish event article"}
              className={cn(
                "h-10 rounded-full px-5 font-bold transition-colors",
                event.finalPost?.status === "PUBLISHED"
                  ? "border border-border-default bg-subtle-bg text-text-secondary shadow-sm hover:bg-muted hover:text-text-primary"
                  : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700",
              )}
              title={event.finalPost?.status === "PUBLISHED" ? "Unpublish event article" : "Publish event article"}
              type="button"
            >
              {event.finalPost?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </Button>
            {event.finalPost?.status === "PUBLISHED" && (
              <Button asChild className="h-10 w-10 rounded-full p-0 transition-all hover:scale-105" variant="ghost">
                <Link
                  aria-label="View event post"
                  href={`/${event.finalPost.slug}`}
                  title="View event post"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

          <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-bold text-text-primary">
                  Event name
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-text-secondary">
                  This is also used as the published event article title.
                </p>
              </div>
              <Button
                aria-label="Save event name"
                className="h-9 w-9 shrink-0 rounded-full p-0 transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                disabled={isPending || title.trim().length === 0}
                onClick={() => void patchEvent({ title: title.trim() })}
                title="Save event name"
                type="button"
                variant="outline"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <Input
              className="h-11 rounded-[12px] border-border-default/60 bg-background/60 px-4 text-[14px] font-semibold transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
              maxLength={200}
              onChange={(changeEvent) => setTitle(changeEvent.target.value)}
              placeholder="Event name"
              value={title}
            />
          </section>

          <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-text-primary">
                Event introduction
              </h2>
              <Button
                disabled={isPending}
                onClick={() => void patchEvent({ introText })}
                aria-label="Save event introduction"
                className="h-9 w-9 rounded-full p-0 font-semibold transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                title="Save event introduction"
                type="button"
                variant="outline"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              className="min-h-32 resize-y rounded-[16px] border-border-default/60 bg-background/50 p-5 text-[14px] transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
              onChange={(changeEvent) => setIntroText(changeEvent.target.value)}
              placeholder="Short editor intro shown before the entries list."
              value={introText}
            />
          </section>

          <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-text-primary">
              Published article details
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-text-secondary">
              Optional metadata for the event article. Empty fields stay empty.
            </p>
          </div>
          <Button
            aria-label="Save article details"
            className="h-9 w-9 shrink-0 rounded-full p-0 transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
            disabled={isPending}
            onClick={() =>
              void patchEvent({
                categoryId: categoryId || null,
                coverAlt: coverAlt.trim() || null,
                coverUrl: coverUrl || null,
                tagIds: selectedTagIds,
              })
            }
            title="Save article details"
            type="button"
            variant="outline"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="rounded-[20px] border border-border-default/70 bg-background/70 p-4 shadow-sm">
            <CoverImageUpload onChange={setCoverUrl} value={coverUrl} />
            {coverUrl && (
              <div className="mt-4 space-y-2">
                <label
                  className="text-[12px] font-semibold text-text-secondary"
                  htmlFor="event-cover-alt"
                >
                  Event cover alt text
                </label>
                <Input
                  id="event-cover-alt"
                  maxLength={200}
                  onChange={(changeEvent) => setCoverAlt(changeEvent.target.value)}
                  placeholder="Describe the event cover"
                  value={coverAlt}
                />
              </div>
            )}
          </div>

          <div className="space-y-5 rounded-[20px] border border-border-default/70 bg-background/70 p-4 shadow-sm">
            <div className="space-y-2">
              <label
                className="text-[12px] font-semibold text-text-secondary"
                htmlFor="event-category"
              >
                Event category
              </label>
              <select
                className="h-10 w-full cursor-pointer rounded-[8px] border border-border-default bg-background px-3 text-[13px] text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                id="event-category"
                onChange={(changeEvent) => setCategoryId(changeEvent.target.value)}
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

            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-text-secondary">Event tags</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-[12px] border border-border-default/60 bg-subtle-bg/20 p-3">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)

                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        selected
                          ? "border-accent bg-accent text-white"
                          : "border-border-default/60 bg-background text-text-secondary hover:border-accent/40 hover:text-accent",
                      )}
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      type="button"
                    >
                      {tag.name}
                    </button>
                  )
                })}
                {tags.length === 0 && (
                  <p className="w-full py-1 text-center text-[12px] text-text-tertiary">
                    No tags available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
          </section>

        </div>

      <section
        className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-border-default/70 bg-background/75 p-5 shadow-sm backdrop-blur-xl xl:sticky xl:top-0"
        data-testid="event-submissions-column"
      >
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Submissions
          </div>
          <Button
            aria-label="Shuffle submissions"
            className="h-9 w-9 rounded-full p-0 transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
            aria-busy={isSavingOrder}
            disabled={isRemovingRoom || rooms.length < 2}
            onClick={shuffleRooms}
            title="Shuffle submissions"
            type="button"
            variant="outline"
          >
            <Shuffle
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 motion-reduce:transition-none"
              style={{ transform: `rotate(${shuffleTurns * 180}deg)` }}
            />
          </Button>
        </div>
        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1"
          data-testid="event-submissions-scroll"
        >
          {rooms.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-12 text-center text-[14px] text-text-tertiary">
              No writers have joined yet.
            </div>
          ) : (
            <DndContext
              collisionDetection={submissionCollisionDetection}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragCancel={() => setDraggingRoomId(null)}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              sensors={sensors}
            >
              <SortableContext
                items={rooms.map((room) => room.id)}
                strategy={verticalListSortingStrategy}
              >
              {rooms.map((room) => (
              <SortableSubmission
                className={cn(
                  "group relative rounded-[18px] border border-transparent bg-subtle-bg/40 p-4 transition-colors duration-200 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10",
                  room.excludedAt && "opacity-60",
                  draggingRoomId === room.id && "border-dashed border-accent/50 bg-accent/5",
                )}
                disabled={isRemovingRoom}
                id={room.id}
                key={room.id}
              >
                {({ attributes, listeners }) => (
                <div data-testid={`event-submission-${room.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-bold text-text-primary">
                        {room.writer.name}
                      </h3>
                      <span className="rounded-full border border-border-default/60 bg-background/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                        {room.status}
                      </span>
                      <span className="rounded-full border border-border-default/60 bg-background/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                        {room.visibility === "PARTICIPANTS" ? "Shared" : "Private"}
                      </span>
                      {room.writer.role === "REVOKED" && (
                        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                          Access removed
                        </span>
                      )}
                      {room.excludedAt && (
                        <span className="rounded-full border border-border-default bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                          Excluded
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-text-secondary">
                      <span className="text-accent">@{room.writer.username}</span>
                      <span className="mx-2 text-text-tertiary">·</span>
                      {room._count.comments} feedback comments
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-[12px] border border-border-default/50 bg-background/80 p-1 shadow-sm backdrop-blur-sm">
                    <button
                      {...attributes}
                      {...listeners}
                      aria-label={`Drag ${room.writer.name} to reorder`}
                      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary active:cursor-grabbing"
                      title="Drag to reorder"
                      type="button"
                    >
                      <GripVertical aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <Button
                      aria-label={
                        room.excludedAt ? "Include in final event" : "Exclude from final event"
                      }
                      className="h-8 w-8 rounded-[8px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                      disabled={
                        isPending ||
                        room.status !== "SUBMITTED" ||
                        !(room.selectedPost || room.submittedPostId)
                      }
                      onClick={() => toggleRoomExclusion(room.id)}
                      size="icon"
                      title={
                        room.excludedAt ? "Include in final event" : "Exclude from final event"
                      }
                      type="button"
                      variant="ghost"
                    >
                      {room.excludedAt ? (
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <EyeOff aria-hidden="true" className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      aria-label={`Remove ${room.writer.name} from event`}
                      className="h-8 w-8 rounded-[8px] text-text-secondary hover:bg-destructive/10 hover:text-destructive"
                      disabled={isRemovingRoom || isSavingOrder}
                      onClick={() => setRemoveTarget(room)}
                      size="icon"
                      title={`Remove ${room.writer.name} from event`}
                      type="button"
                      variant="ghost"
                    >
                      <UserMinus aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    {room.selectedPost || room.submittedPostId ? (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-[8px] text-text-secondary hover:bg-accent/10 hover:text-accent">
                        <Link
                          aria-label="Preview selected post"
                          href={`/dashboard/events/${event.id}/rooms/${room.id}`}
                          title="Preview selected post"
                        >
                          <Eye aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="icon"
                        title="No selected post to preview"
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 rounded-[8px]"
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  {room.selectedPost || room.submittedPostTitle ? (
                    <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-accent/20 bg-accent/5 px-3 py-2.5">
                      <p className="truncate text-[13px] font-semibold text-text-primary">
                        {room.selectedPost?.title ?? room.submittedPostTitle}
                      </p>
                      <span className="shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary shadow-sm">
                        {room.selectedPost?.status ?? "SUBMITTED"} source post
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-[13px] font-medium italic text-text-tertiary">
                      No source post selected yet.
                    </p>
                  )}
                </div>
                </div>
                )}
              </SortableSubmission>
              ))}
              </SortableContext>
              <DragOverlay>
                {draggingRoomId ? (
                  <div className="w-[min(420px,calc(100vw-2rem))] rounded-[18px] border border-accent/40 bg-background p-4 shadow-2xl shadow-black/15">
                    <p className="text-[15px] font-bold text-text-primary">
                      {rooms.find((room) => room.id === draggingRoomId)?.writer.name}
                    </p>
                    <p className="mt-1 truncate text-[12px] font-medium text-text-secondary">
                      {rooms.find((room) => room.id === draggingRoomId)?.selectedPost?.title ??
                        rooms.find((room) => room.id === draggingRoomId)?.submittedPostTitle ??
                        "No source post selected"}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </section>
      </div>
      <ConfirmationDialog
        confirmLabel="Remove participant"
        description={
          <>
            Remove <strong className="text-text-primary">{removeTarget?.writer.name}</strong>
            from this event and delete their event feedback. Their account and source post
            will not be deleted.
          </>
        }
        icon={UserMinus}
        onConfirm={() => void removeParticipant()}
        onOpenChange={(open) => {
          if (!open && !isRemovingRoom) setRemoveTarget(null)
        }}
        open={Boolean(removeTarget)}
        pending={isRemovingRoom}
        title="Remove participant?"
        tone="destructive"
      />
    </div>
  )
}
