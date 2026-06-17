import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Edit2, Eye, FileText, Lock, MessageSquare } from "lucide-react"

import { joinAwardEvent } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardEventRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardEventRoomPage({
  params,
}: DashboardEventRoomPageProps) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  let event = await prisma.awardEvent.findUnique({
    select: {
      finalPost: { select: { slug: true } },
      id: true,
      rooms: {
        select: {
          id: true,
          postId: true,
          selectedPost: {
            select: {
              id: true,
              status: true,
              title: true,
            },
          },
          status: true,
          visibility: true,
          writerIntro: true,
        },
        where: { writerId: session.user.id },
      },
      status: true,
      title: true,
    },
    where: { id },
  })

  if (
    !event ||
    (event.status !== "OPEN" &&
      event.status !== "PUBLISHED" &&
      event.status !== "CLOSED")
  ) {
    notFound()
  }

  if (!event.rooms[0]) {
    if (event.status === "CLOSED") {
      notFound()
    }

    await joinAwardEvent(id, session.user.id)
    event = await prisma.awardEvent.findUnique({
      select: {
        finalPost: { select: { slug: true } },
        id: true,
        rooms: {
          select: {
            id: true,
            postId: true,
            selectedPost: {
              select: {
                id: true,
                status: true,
                title: true,
              },
            },
            status: true,
            visibility: true,
            writerIntro: true,
          },
          where: { writerId: session.user.id },
        },
        status: true,
        title: true,
      },
      where: { id },
    })
  }

  const room = event?.rooms[0]

  if (!event || !room) {
    notFound()
  }

  // Get unread feedback count on current user's room
  const unreadFeedbackCount = await prisma.awardEventRoomComment.count({
    where: {
      authorId: { not: session.user.id },
      isRead: false,
      roomId: room.id,
    },
  })

  // Get all participants' rooms in this event (including ours)
  const participantRooms = await prisma.awardEventRoom.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      postId: true,
      selectedPost: {
        select: {
          id: true,
          status: true,
          title: true,
        },
      },
      status: true,
      visibility: true,
      writer: {
        select: {
          avatarUrl: true,
          id: true,
          name: true,
          username: true,
        },
      },
      writerIntro: true,
    },
    where: {
      eventId: id,
    },
  })

  // Separate current user's room and other participants' rooms
  const ourRoom = participantRooms.find((pr) => pr.writer.id === session.user.id) || room
  const otherParticipants = participantRooms.filter((pr) => pr.writer.id !== session.user.id)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-border-default pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Event Overview
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {event.title}
          </h1>
        </div>
        <div className="flex gap-2">
          {event.finalPost && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${event.finalPost.slug}`}>Public post</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Section: Your Submission */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary">
            Your Room
          </h2>
          <div className="rounded-xl border-2 border-accent/20 bg-accent/5 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {session.user.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name || "You"}
                  className="h-12 w-12 rounded-full object-cover border-2 border-accent/20"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent text-lg font-bold uppercase border-2 border-accent/20">
                  {(session.user.name || "Y").charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <div className="font-semibold text-text-primary text-base flex items-center gap-2">
                  {session.user.name || "You"}
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-accent/10 text-accent hover:bg-accent/10 px-1.5 py-0">
                    You
                  </Badge>
                </div>
                {!ourRoom.postId || !ourRoom.selectedPost ? (
                  <p className="text-sm text-text-tertiary italic">Not selected yet</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                      <FileText className="h-4 w-4 text-accent" />
                      {ourRoom.selectedPost.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ourRoom.visibility === "PARTICIPANTS" ? (
                        <Badge
                          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                          variant="outline"
                        >
                          Shared
                        </Badge>
                      ) : (
                        <Badge
                          className="border-border bg-muted text-muted-foreground hover:bg-muted"
                          variant="outline"
                        >
                          Private
                        </Badge>
                      )}

                      {ourRoom.status === "SUBMITTED" && (
                        <Badge
                          className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/15"
                          variant="outline"
                        >
                          Submitted
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              {ourRoom.postId && ourRoom.selectedPost && (
                <Button asChild size="sm" variant="outline" className="font-semibold">
                  <Link href={`/dashboard/preview/${ourRoom.selectedPost.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              )}
              {ourRoom.postId && ourRoom.selectedPost && (
                <Button asChild size="sm" variant="outline" className="relative font-semibold">
                  <Link href={`/dashboard/events/${id}/rooms/${ourRoom.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feedback
                    {unreadFeedbackCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse shadow-md">
                        {unreadFeedbackCount}
                      </span>
                    )}
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="font-semibold">
                <Link href={`/dashboard/events/${id}/edit`}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section: Other Participants */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary">
            Other Participants
          </h2>

          {otherParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-sm text-text-secondary italic">
              No other participants in this event yet.
            </div>
          ) : (
            <div className="space-y-3">
              {otherParticipants.map((pr) => (
                <div
                  key={pr.id}
                  className="rounded-xl border border-border-default bg-background p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {pr.writer.avatarUrl ? (
                      <img
                        src={pr.writer.avatarUrl}
                        alt={pr.writer.name}
                        className="h-10 w-10 rounded-full object-cover border border-border-default"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground border border-border-default">
                        {pr.writer.name.charAt(0)}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="font-semibold text-sm text-text-primary">
                        {pr.writer.name}{" "}
                        <span className="text-xs font-normal text-text-tertiary ml-1">
                          @{pr.writer.username}
                        </span>
                      </div>
                      {!pr.postId || !pr.selectedPost ? (
                        <p className="text-xs text-text-tertiary italic">Not selected yet</p>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs font-medium text-text-secondary">
                            <FileText className="h-3.5 w-3.5" />
                            {pr.selectedPost.title}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {pr.visibility === "PARTICIPANTS" ? (
                              <Badge
                                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Shared
                              </Badge>
                            ) : (
                              <Badge
                                className="border-border bg-muted text-muted-foreground hover:bg-muted text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Private
                              </Badge>
                            )}

                            {pr.status === "SUBMITTED" && (
                              <Badge
                                className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/15 text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Submitted
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end w-full sm:w-auto">
                    {pr.postId && pr.selectedPost && pr.visibility === "PARTICIPANTS" ? (
                      <Button asChild size="sm" variant="outline" className="font-semibold w-full sm:w-auto">
                        <Link href={`/dashboard/events/${id}/rooms/${pr.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    ) : pr.postId && pr.selectedPost && pr.visibility === "PRIVATE" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-text-tertiary font-medium py-1">
                        <Lock className="h-3.5 w-3.5" />
                        Private Entry
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
