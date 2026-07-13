import type { JSONContent } from "@tiptap/react"
import Link from "next/link"

import { EventAnthologyTableOfContents } from "@/components/events/EventAnthologyTableOfContents"
import { PostBody } from "@/components/posts/PostBody"
import {
  buildAwardEventOutline,
  getSubmittedAwardEventRooms,
  namespaceAwardEventPostContent,
  type AwardEventPostRoom,
} from "@/lib/awardEvents"

interface AnthologyRoom {
  id: string
  order: number
  selectedPost: {
    content: unknown
    id: string
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED"
    title: string
  } | null
  status: "DRAFT" | "SUBMITTED"
  writer: { avatarUrl?: string | null; name: string; username: string }
  writerIntro: string | null
}

interface EventAnthologyViewProps {
  event: {
    coverAlt: string | null
    coverUrl: string | null
    intro: unknown
    introText: string | null
    rooms: AnthologyRoom[]
    title: string
  }
  preview?: boolean
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === "object" && value !== null && "type" in value
}

export function EventAnthologyView({ event, preview = false }: EventAnthologyViewProps) {
  const normalizedRooms: Array<AwardEventPostRoom & {
    writer: AwardEventPostRoom["writer"] & { avatarUrl?: string | null }
  }> = event.rooms.map((room) => ({
    ...room,
    selectedPost: room.selectedPost
      ? {
          ...room.selectedPost,
          content: isJsonContent(room.selectedPost.content)
            ? room.selectedPost.content
            : { content: [], type: "doc" },
        }
      : null,
  }))
  const rooms = getSubmittedAwardEventRooms(normalizedRooms)
  const headings = buildAwardEventOutline(rooms)

  return (
    <main className="w-full overflow-x-hidden pb-24">
      {preview && (
        <div className="sticky top-0 z-50 border-b border-accent/30 bg-background/90 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-accent backdrop-blur-xl">
          Preview only — this event is not being published
        </div>
      )}

      <header className="relative isolate min-h-[64vh] overflow-hidden border-b border-border-default">
        {event.coverUrl && (
          <img
            alt={event.coverAlt || ""}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src={event.coverUrl}
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background))_8%,hsl(var(--background)/0.9)_42%,hsl(var(--background)/0.35)_100%)]" />
        <div className="mx-auto flex min-h-[64vh] w-full max-w-7xl items-end px-4 py-14 sm:px-6 md:py-20 lg:px-10">
          <div className="max-w-6xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Event anthology
            </p>
            <h1 className="max-w-6xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-text-primary sm:text-6xl lg:text-7xl">
              {event.title}
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              {rooms.length} writers, collected as one continuous edition.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-4 pt-12 sm:px-6 lg:px-10 xl:grid-cols-[minmax(0,900px)_220px]">
        <div className="min-w-0">
          {(isJsonContent(event.intro) || event.introText) && (
            <section className="mb-20 border-y border-border-default py-10 sm:py-14">
              {isJsonContent(event.intro) ? (
                <div className="post-content font-lora text-[17px] leading-8 text-text-primary">
                  <PostBody content={event.intro} />
                </div>
              ) : (
                <p className="max-w-3xl font-lora text-xl leading-9 text-text-primary">
                  {event.introText}
                </p>
              )}
            </section>
          )}

          {rooms.length === 0 ? (
            <div className="border-y border-dashed border-border-default py-20 text-center text-text-secondary">
              No submitted entries are included yet.
            </div>
          ) : (
            <div className="space-y-24 sm:space-y-32">
              {rooms.map((room, index) => (
                <section id={`event-room-${room.id}`} key={room.id}>
                  <div className="mb-10 grid gap-6 border-t-2 border-text-primary pt-5 sm:grid-cols-[5rem_minmax(0,1fr)]">
                    <div className="font-display text-4xl font-bold tabular-nums text-accent/70">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        {room.writer.avatarUrl ? (
                          <img
                            alt={room.writer.name}
                            className="h-12 w-12 rounded-full object-cover"
                            src={room.writer.avatarUrl}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-subtle-bg font-bold">
                            {room.writer.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                            {room.writer.name}
                          </h2>
                          <Link
                            className="text-sm text-text-tertiary transition-colors hover:text-accent"
                            href={`/authors/${room.writer.username}`}
                          >
                            @{room.writer.username}
                          </Link>
                        </div>
                      </div>
                      {room.writerIntro && (
                        <p className="mt-6 max-w-2xl border-l-2 border-accent pl-5 font-lora text-lg italic leading-8 text-text-secondary">
                          {room.writerIntro}
                        </p>
                      )}
                    </div>
                  </div>

                  <article className="post-content font-lora text-[16px] leading-[1.8] text-text-primary sm:text-[17.5px]">
                    <PostBody
                      content={namespaceAwardEventPostContent(
                        room.selectedPost?.content ?? { type: "doc", content: [] },
                        room.id,
                      )}
                    />
                  </article>
                </section>
              ))}
            </div>
          )}
        </div>

        {headings.length > 0 && (
          <aside className="hidden xl:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <EventAnthologyTableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
