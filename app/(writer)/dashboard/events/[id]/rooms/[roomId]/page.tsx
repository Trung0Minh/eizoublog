import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"

import type { JSONContent } from "@tiptap/react"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/lib/session"
import { getCoverStyle } from "@/lib/cover-style"
import { PostBody } from "@/components/posts/PostBody"
import { PostContentFrame } from "@/components/posts/PostContentFrame"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { RoomFeedbackSection } from "@/components/events/RoomFeedbackSection"
import { extractHeadings } from "@/lib/postHeadings"

interface RoomDetailPageProps {
  params: Promise<{ id: string; roomId: string }>
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id: eventId, roomId } = await params

  // Fetch the room with writer details, selected post and event details
  const room = await prisma.awardEventRoom.findUnique({
    include: {
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      selectedPost: {
        select: {
          content: true,
          coverUrl: true,
          id: true,
          status: true,
          title: true,
        },
      },
      writer: {
        select: {
          avatarUrl: true,
          bio: true,
          id: true,
          name: true,
          username: true,
        },
      },
    },
    where: { id: roomId },
  })

  // Verify room exists and belongs to the specified event, and has a selected post
  if (!room || room.eventId !== eventId || !room.selectedPost) {
    notFound()
  }

  // Authorization check:
  // 1. Author of the room: YES
  // 2. Admin: YES
  // 3. Other participant in the same event, AND room visibility is PARTICIPANTS: YES
  const isOwner = room.writerId === session.user.id
  const isAdmin = session.user.role === "ADMIN"

  let hasAccess = isOwner || isAdmin

  if (!hasAccess && room.visibility === "PARTICIPANTS") {
    // Check if the viewer is a participant in the same event
    const participant = await prisma.awardEventRoom.findUnique({
      select: { id: true },
      where: { eventId_writerId: { eventId, writerId: session.user.id } },
    })
    if (participant) {
      hasAccess = true
    }
  }

  if (!hasAccess) {
    notFound()
  }

  // If the owner is viewing, mark all comments written by others as read
  if (isOwner) {
    await prisma.awardEventRoomComment.updateMany({
      data: { isRead: true },
      where: {
        authorId: { not: session.user.id },
        isRead: false,
        roomId,
      },
    })
  }

  // Fetch comments matching privacy visibility rules
  const comments = await prisma.awardEventRoomComment.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      author: { select: { avatarUrl: true, name: true, username: true } },
      authorId: true,
      content: true,
      createdAt: true,
      id: true,
      isPrivate: true,
    },
    where: {
      roomId,
      ...(hasAccess && !isOwner && !isAdmin
        ? {
            OR: [
              { isPrivate: false },
              { authorId: session.user.id, isPrivate: true },
            ],
          }
        : {}),
    },
  })
  const selectedPostContent = room.selectedPost.content as unknown as JSONContent
  const hasTableOfContents = extractHeadings(selectedPostContent).length > 0

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event Overview
        </Link>
      </div>

      <div className="space-y-8">
        {/* Header Section */}
        <div className="border-b border-border-default pb-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              {room.event.title}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {room.selectedPost.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Writer Info */}
            <div className="flex items-center gap-3">
              {room.writer.avatarUrl ? (
                <img
                  src={room.writer.avatarUrl}
                  alt={room.writer.name}
                  className="h-10 w-10 rounded-full object-cover border border-border-default"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground border border-border-default">
                  {room.writer.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-semibold text-sm text-text-primary">{room.writer.name}</div>
                <div className="text-xs text-text-tertiary">@{room.writer.username}</div>
              </div>
            </div>

            {/* Visibility Badge */}
            <div className="flex items-center gap-2">
              {room.visibility === "PRIVATE" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border-default">
                  <Lock className="h-3.5 w-3.5" />
                  Private Submission
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Shared Entry
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Post Image */}
        {room.selectedPost.coverUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-[8px] border border-border-default bg-subtle-bg">
            <div className="absolute inset-0 overflow-hidden">
              <img
                alt={room.selectedPost.title}
                className="h-full w-full"
                style={getCoverStyle(room.selectedPost.coverUrl)}
                decoding="async"
                fetchPriority="high"
                loading="eager"
                src={room.selectedPost.coverUrl.split("?")[0]}
              />
            </div>
          </div>
        )}

        {hasTableOfContents && (
          <div className="xl:hidden">
            <TableOfContents collapsible content={selectedPostContent} />
          </div>
        )}

        {/* Main Content Area with sidebar Table of Contents */}
        <div className="flex w-full flex-col gap-12 xl:flex-row items-start">
          <article
            className={
              hasTableOfContents
                ? "min-w-0 flex-1 w-full max-w-[800px]"
                : "min-w-0 flex-1 w-full"
            }
          >
            {/* Post Content */}
            <PostContentFrame>
              <PostBody content={selectedPostContent} />
            </PostContentFrame>

            {/* Feedback Section */}
            <RoomFeedbackSection
              eventId={eventId}
              roomId={roomId}
              initialComments={comments}
            />
          </article>
          {hasTableOfContents && (
            <aside className="sticky top-24 hidden max-h-[calc(100vh-120px)] w-[200px] shrink-0 self-start overflow-y-auto overscroll-contain no-scrollbar xl:block [scrollbar-gutter:stable]">
              <TableOfContents content={selectedPostContent} />
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
