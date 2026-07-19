import type { JSONContent } from "@tiptap/react"
import Link from "next/link"

import { EventAnthologyTableOfContents } from "@/components/events/EventAnthologyTableOfContents"
import { AuthorCreditList } from "@/components/posts/AuthorCreditList"
import { PostBody } from "@/components/posts/PostBody"
import {
  buildAwardEventOutline,
  getSubmittedAwardEventRooms,
  namespaceAwardEventPostContent,
  type AwardEventPostRoom,
} from "@/lib/awardEvents"
import { cn } from "@/lib/utils"

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
  submittedContent?: unknown
  submittedPostId?: string | null
  submittedPostTitle?: string | null
  submittedWriterIntro?: string | null
  writer: {
    avatarUrl?: string | null
    bio?: string | null
    name: string
    username: string
  }
  writerIntro: string | null
}

interface EventAnthologyViewProps {
  event: {
    category?: { name: string; slug: string } | null
    coverAlt: string | null
    coverUrl: string | null
    intro: unknown
    introText: string | null
    rooms: AnthologyRoom[]
    tags?: Array<{ tag: { name: string; slug: string } }>
    title: string
  }
  preview?: boolean
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === "object" && value !== null && "type" in value
}

function hasMeaningfulContent(node: JSONContent): boolean {
  if (node.type === "text") {
    return Boolean(node.text?.trim())
  }

  if (node.content?.some(hasMeaningfulContent)) {
    return true
  }

  return Boolean(
    node.type &&
      ![
        "blockquote",
        "bulletList",
        "codeBlock",
        "doc",
        "heading",
        "listItem",
        "orderedList",
        "paragraph",
      ].includes(node.type),
  )
}

function EventContributorAttribution({
  writers,
}: {
  writers: AnthologyRoom["writer"][]
}) {
  return (
    <div
      aria-label="Event contributors"
      className="mt-7 flex w-fit max-w-full items-center gap-3 rounded-full border border-border-default bg-background/95 p-2 pr-4 shadow-md backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center">
        {writers.map((writer, index) => (
          <div
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#2d6e7e] text-sm font-bold text-white outline outline-2 outline-background"
            key={writer.username}
            style={{
              marginLeft: index === 0 ? 0 : -12,
              zIndex: index + 10,
            }}
          >
            {writer.avatarUrl ? (
              <img
                alt=""
                className="h-full w-full object-cover"
                src={writer.avatarUrl}
              />
            ) : (
              writer.name.charAt(0)
            )}
          </div>
        ))}
      </div>
      <span className="min-w-0 text-sm font-bold leading-5 text-text-primary">
        {writers.map(({ name }) => name).join(" & ")}
      </span>
    </div>
  )
}

export function EventAnthologyView({ event, preview = false }: EventAnthologyViewProps) {
  const normalizedRooms: Array<AwardEventPostRoom & {
    writer: AwardEventPostRoom["writer"] & {
      avatarUrl: string | null
      bio: string | null
    }
  }> = event.rooms.map((room) => ({
    ...room,
    selectedPost: isJsonContent(room.submittedContent)
      ? {
          content: room.submittedContent,
          id: room.submittedPostId ?? room.selectedPost?.id ?? room.id,
          status: "DRAFT",
          title: room.submittedPostTitle ?? room.selectedPost?.title ?? "Untitled",
        }
      : room.selectedPost
      ? {
          ...room.selectedPost,
          content: isJsonContent(room.selectedPost.content)
            ? room.selectedPost.content
            : { content: [], type: "doc" },
      }
      : null,
    writerIntro: isJsonContent(room.submittedContent)
      ? room.submittedWriterIntro ?? null
      : room.writerIntro,
    writer: {
      ...room.writer,
      avatarUrl: room.writer.avatarUrl ?? null,
      bio: room.writer.bio ?? null,
    },
  }))
  const rooms = getSubmittedAwardEventRooms(normalizedRooms)
  const headings = buildAwardEventOutline(rooms)
  const richIntro =
    isJsonContent(event.intro) && hasMeaningfulContent(event.intro)
      ? event.intro
      : null

  return (
    <main className="w-full overflow-x-clip">
      {preview && (
        <div className="sticky top-0 z-50 border-b border-accent/30 bg-background/90 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-accent backdrop-blur-xl">
          Preview only — this event is not being published
        </div>
      )}

      <header
        className={cn(
          "relative isolate overflow-hidden",
          preview
            ? "min-h-[440px] sm:min-h-[56vh] lg:min-h-[64vh]"
            : "-mt-[88px] min-h-[calc(440px+88px)] pt-[88px] sm:min-h-[calc(56vh+88px)] lg:min-h-[calc(64vh+88px)]",
        )}
      >
        {event.coverUrl && (
          <img
            alt={event.coverAlt || ""}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src={event.coverUrl}
          />
        )}
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background)/0.78)_0%,hsl(var(--background)/0.48)_42%,hsl(var(--background)/0.12)_100%)]"
          data-testid="event-cover-overlay"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent"
          data-testid="event-cover-bottom-fade"
        />
        <div className="mx-auto flex min-h-[440px] w-full max-w-7xl items-end px-4 py-12 sm:min-h-[56vh] sm:px-6 md:py-20 lg:min-h-[64vh] lg:px-10">
          <div className="max-w-6xl">
            {(event.category || (event.tags?.length ?? 0) > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                {event.category && (
                  <Link
                    className="rounded-full border border-accent/25 bg-background/80 px-3 py-1.5 transition-colors hover:border-accent hover:bg-accent/10"
                    href={`/category/${event.category.slug}`}
                  >
                    {event.category.name}
                  </Link>
                )}
                {event.tags?.map(({ tag }) => (
                  <Link
                    className="rounded-full border border-border-default bg-background/70 px-3 py-1.5 text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
                    href={`/tag/${tag.slug}`}
                    key={tag.slug}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="max-w-6xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-text-primary sm:text-6xl lg:text-7xl">
              {event.title}
            </h1>
            {rooms.length > 0 && (
              <EventContributorAttribution
                writers={rooms.map(({ writer }) => writer)}
              />
            )}
          </div>
        </div>
      </header>

      <div className="pointer-events-none relative z-0 h-0">
        <div
          className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-background to-transparent md:h-48 lg:h-64"
          data-testid="event-hero-transition"
        />
      </div>

      <div
        className="relative z-10 mx-auto grid w-full max-w-[1360px] gap-12 px-4 pt-12 sm:px-6 lg:px-10 xl:grid-cols-[minmax(0,1000px)_220px] xl:justify-center"
        data-testid="event-content-grid"
      >
        <div className="min-w-0 space-y-8 sm:space-y-10">
          {event.coverAlt && (
            <p
              className="break-words pr-1 text-right text-[13px] font-medium italic text-text-tertiary [overflow-wrap:anywhere] md:text-[14px]"
              data-testid="event-cover-alt"
            >
              {event.coverAlt}
            </p>
          )}
          {headings.length > 0 && (
            <div className="xl:hidden">
              <EventAnthologyTableOfContents collapsible headings={headings} />
            </div>
          )}
          {(richIntro || event.introText) && (
            <section className="rounded-[24px] border border-border-default/80 bg-background/90 p-5 shadow-[0_18px_60px_rgba(31,24,38,0.08)] backdrop-blur-xl dark:bg-background/80 sm:p-8 md:p-10">
              <div
                className="post-content font-lora text-[17px] leading-8 text-text-primary sm:text-xl sm:leading-9"
                data-testid="event-intro-content"
              >
                {richIntro ? (
                  <PostBody content={richIntro} />
                ) : (
                  <p className="w-full max-w-none break-words [overflow-wrap:anywhere]">
                    {event.introText}
                  </p>
                )}
              </div>
            </section>
          )}

          {rooms.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border-default bg-background/70 py-20 text-center text-text-secondary">
              No submitted entries are included yet.
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {rooms.map((room) => (
                <section
                  className="scroll-mt-24 rounded-[24px] border border-border-default/80 bg-background/90 p-5 shadow-[0_18px_60px_rgba(31,24,38,0.08)] backdrop-blur-xl dark:bg-background/80 sm:p-8 md:p-10"
                  data-testid="event-contributor-block"
                  id={`event-room-${room.id}`}
                  key={room.id}
                >
                  <div
                    className="mb-6 sm:mb-8"
                    data-testid="event-contributor-header"
                  >
                    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-7">
                      {room.writer.avatarUrl ? (
                        <img
                          alt={room.writer.name}
                          className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                          src={room.writer.avatarUrl}
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border-default bg-background font-display text-3xl font-bold sm:h-32 sm:w-32">
                          {room.writer.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                          {room.writer.name}
                        </h2>
                        {room.writerIntro && (
                          <p className="mt-2 text-[13px] leading-5 text-text-secondary sm:mt-3 sm:text-base sm:leading-7">
                            {room.writerIntro}
                          </p>
                        )}
                      </div>
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
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
              <EventAnthologyTableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="mx-auto grid w-full max-w-[1360px] gap-12 px-4 pt-12 sm:px-6 lg:px-10 xl:grid-cols-[minmax(0,1000px)_220px] xl:justify-center">
          <div className="min-w-0 font-sans text-text-primary">
            <AuthorCreditList authors={rooms.map(({ writer }) => writer)} />
          </div>
        </div>
      )}
    </main>
  )
}
