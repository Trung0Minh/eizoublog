import type { JSONContent } from "@tiptap/react"
import Link from "next/link"

import { EventCoverParallax } from "@/components/events/EventCoverParallax"
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
  writerIntro?: string | null
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
  }> = event.rooms.map((room) => {
    const submittedContent = isJsonContent(room.submittedContent)
      ? room.submittedContent
      : null
    const hasSubmittedSnapshot = submittedContent !== null

    return {
      ...room,
      selectedPost: hasSubmittedSnapshot
        ? {
            content: submittedContent,
            id: room.submittedPostId ?? room.selectedPost?.id ?? room.id,
            status: "DRAFT",
            title:
              room.submittedPostTitle ?? room.selectedPost?.title ?? "Untitled",
          }
        : room.selectedPost
          ? {
              ...room.selectedPost,
              content: isJsonContent(room.selectedPost.content)
                ? room.selectedPost.content
                : { content: [], type: "doc" },
            }
          : null,
      writer: {
        ...room.writer,
        avatarUrl: room.writer.avatarUrl ?? null,
        bio: room.writer.bio ?? null,
      },
    }
  })
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
            : "-mt-[64px] min-h-[calc(440px+64px)] pt-[64px] sm:min-h-[calc(56vh+64px)] md:-mt-[88px] md:min-h-[calc(56vh+88px)] md:pt-[88px] lg:min-h-[calc(64vh+88px)]",
        )}
      >
        {event.coverUrl && (
          <EventCoverParallax
            alt={event.coverAlt || ""}
            src={event.coverUrl}
          />
        )}
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background)/0.78)_0%,hsl(var(--background)/0.48)_42%,hsl(var(--background)/0.12)_100%)]"
          data-testid="event-cover-overlay"
        />
        <div
          className="absolute inset-x-0 bottom-0 top-[18%] -z-10 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.92)_14%,hsl(var(--background)/0.68)_36%,hsl(var(--background)/0.28)_64%,transparent_100%)]"
          data-testid="event-cover-bottom-fade"
        />
        <div
          className="mx-auto grid min-h-[440px] w-full max-w-7xl items-end gap-8 px-4 py-12 sm:min-h-[56vh] sm:px-6 md:py-20 lg:min-h-[64vh] lg:grid-cols-[minmax(0,1000px)] lg:justify-start lg:px-10 2xl:max-w-[1360px] 2xl:grid-cols-[minmax(0,1000px)_220px] 2xl:pl-20 2xl:pr-0"
          data-testid="event-hero-grid"
        >
          <div className="min-w-0" data-testid="event-hero-main-column">
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
          className="absolute left-0 right-0 top-[-1px] h-40 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,hsl(var(--background)/0.86)_24%,hsl(var(--background)/0.42)_62%,transparent_100%)] md:h-56 lg:h-72"
          data-testid="event-hero-transition"
        />
      </div>

      <div
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 pt-6 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1000px)] lg:justify-start lg:px-10 2xl:max-w-[1360px] 2xl:grid-cols-[minmax(0,1000px)_220px] 2xl:pl-20 2xl:pr-0"
        data-testid="event-content-grid"
      >
        <div className="min-w-0 space-y-6 sm:space-y-8">
          {event.coverAlt && (
            <p
              className="break-words pr-1 text-right text-[13px] font-medium italic text-text-tertiary [overflow-wrap:anywhere] md:text-[14px]"
              data-testid="event-cover-alt"
            >
              {event.coverAlt}
            </p>
          )}
          {headings.length > 0 && (
            <div className="2xl:hidden">
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
            <div className="space-y-6 sm:space-y-8">
              {rooms.map((room) => (
                <section
                  className="relative scroll-mt-24 rounded-[24px] border border-border-default/80 bg-background/90 p-5 shadow-[0_18px_60px_rgba(31,24,38,0.08)] backdrop-blur-xl dark:bg-background/80 sm:p-8 md:p-10"
                  data-testid="event-contributor-block"
                  id={`event-room-${room.id}`}
                  key={room.id}
                >
                  <div
                    className="mb-8 flex flex-col items-center text-center 2xl:absolute 2xl:left-[-9rem] 2xl:top-10 2xl:mb-0 2xl:w-32"
                    data-testid="event-contributor-header"
                  >
                    {room.writer.avatarUrl ? (
                      <img
                        alt={room.writer.name}
                        className="aspect-square h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-accent/25 ring-offset-4 ring-offset-background/40 sm:h-32 sm:w-32"
                        src={room.writer.avatarUrl}
                      />
                    ) : (
                      <div className="flex aspect-square h-28 w-28 shrink-0 items-center justify-center rounded-full border border-border-default bg-background font-display text-3xl font-bold sm:h-32 sm:w-32">
                        {room.writer.name.charAt(0)}
                      </div>
                    )}
                    <h2 className="mt-4 max-w-full break-words font-display text-2xl font-bold leading-tight tracking-tight text-text-primary">
                      {room.writer.name}
                    </h2>
                  </div>

                  <article className="post-content min-w-0 font-lora text-[16px] leading-[1.8] text-text-primary sm:text-[17.5px]">
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
          <aside className="hidden 2xl:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
              <EventAnthologyTableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>

      {rooms.length > 0 && (
        <div
          className="mx-auto grid w-full max-w-7xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1000px)] lg:justify-start lg:px-10 2xl:max-w-[1360px] 2xl:grid-cols-[minmax(0,1000px)_220px] 2xl:pl-20 2xl:pr-0"
          data-testid="event-author-credits"
        >
          <div className="min-w-0 font-sans text-text-primary">
            <AuthorCreditList authors={rooms.map(({ writer }) => writer)} />
          </div>
        </div>
      )}
    </main>
  )
}
