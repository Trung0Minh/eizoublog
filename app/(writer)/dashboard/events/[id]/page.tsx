import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Eye, FileText, Lock } from "lucide-react"

import { EventRoomEditor } from "@/components/events/EventRoomEditor"
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
      finalPost: { select: { slug: true, status: true } },
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
              version: true,
            },
          },
          submittedPostId: true,
          submittedPostVersion: true,
          status: true,
          visibility: true,
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
    (event.status !== "OPEN" && event.status !== "CLOSED")
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
        finalPost: { select: { slug: true, status: true } },
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
                version: true,
              },
            },
            submittedPostId: true,
            submittedPostVersion: true,
            status: true,
            visibility: true,
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
          version: true,
        },
      },
      submittedPostId: true,
      submittedPostVersion: true,
      status: true,
      visibility: true,
      writer: {
        select: {
          avatarUrl: true,
          id: true,
          name: true,
          role: true,
          username: true,
        },
      },
    },
    where: {
      eventId: id,
    },
  })

  // Separate current user's room and other participants' rooms
  const ourRoom = participantRooms.find((pr) => pr.writer.id === session.user.id) || room
  const otherParticipants = participantRooms.filter(
    (pr) =>
      pr.writer.id !== session.user.id &&
      (pr.writer.role !== "REVOKED" || pr.status === "SUBMITTED"),
  )
  const eligiblePosts = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      title: true,
      updatedAt: true,
      version: true,
    },
    where: {
      authorId: session.user.id,
      finalAwardEvent: null,
      status: { in: ["DRAFT", "PUBLISHED"] },
    },
  })

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <Link
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
        href="/dashboard/events"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại danh sách sự kiện
      </Link>
      {/* Header */}
      <div className="mb-8 border-b border-border-default pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Tổng quan sự kiện
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {event.title}
            </h1>
            <Badge
              className={
                event.status === "OPEN"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              }
              variant="outline"
            >
              {event.status === "OPEN" ? "Đang mở" : "Đã đóng"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {event.finalPost?.status === "PUBLISHED" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${event.finalPost.slug}`}>Bài viết công khai</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Section: Your Submission */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary">
            Phòng của bạn
          </h2>
          <EventRoomEditor
            eligiblePosts={eligiblePosts}
            event={event}
            room={ourRoom}
          />
          <div className="flex items-start justify-between gap-3 rounded-[16px] border border-border-default/80 bg-background/60 p-4 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-background/85 hover:shadow-lg dark:border-white/10 dark:bg-background/40 dark:hover:bg-background/60 sm:items-center sm:gap-6 sm:p-6">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              {session.user.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name || "Bạn"}
                  className="h-12 w-12 rounded-full object-cover border-2 border-accent/20"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent text-lg font-bold uppercase border-2 border-accent/20">
                  {(session.user.name || "Y").charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <div className="font-semibold text-text-primary text-base flex items-center gap-2">
                  {session.user.name || "Bạn"}
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-accent/10 text-accent hover:bg-accent/10 px-1.5 py-0">
                    Bạn
                  </Badge>
                </div>
                {!ourRoom.postId || !ourRoom.selectedPost ? (
                  <p className="text-sm text-text-tertiary italic">Chưa chọn bài</p>
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
                          Chia sẻ
                        </Badge>
                      ) : (
                        <Badge
                          className="border-border bg-muted text-muted-foreground hover:bg-muted"
                          variant="outline"
                        >
                          Riêng tư
                        </Badge>
                      )}

                      {ourRoom.status === "SUBMITTED" && (
                        <Badge
                          className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/15"
                          variant="outline"
                        >
                          Đã gửi
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {ourRoom.postId && ourRoom.selectedPost && (
                <Button asChild size="icon" variant="outline">
                  <Link
                    aria-label="Xem trước bài dự thi"
                    href={`/dashboard/preview/${ourRoom.selectedPost.id}`}
                    title="Xem trước bài dự thi"
                  >
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Section: Other Participants */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
              Người tham gia khác
            </h2>
            <span className="text-xs font-semibold text-text-tertiary">
              {otherParticipants.length} tác giả
            </span>
          </div>

          {otherParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-sm text-text-secondary italic">
              Chưa có người tham gia khác trong sự kiện này.
            </div>
          ) : (
            <div className="space-y-3">
              {otherParticipants.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-start justify-between gap-3 rounded-[16px] border border-border-default/80 bg-background/60 p-4 shadow-[0_8px_28px_rgba(31,24,38,0.06)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent/40 hover:bg-background/85 hover:shadow-lg dark:border-white/10 dark:bg-background/40 dark:hover:bg-background/60 sm:items-center sm:gap-4 sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    {pr.writer.avatarUrl ? (
                      <img
                        src={pr.writer.avatarUrl}
                        alt={pr.writer.name}
                        className="h-11 w-11 shrink-0 rounded-full border border-border-default object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-subtle-bg text-sm font-bold uppercase text-text-secondary">
                        {pr.writer.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <div className="text-sm font-bold text-text-primary">
                        {pr.writer.name}{" "}
                        <span className="ml-1 text-xs font-medium text-text-secondary">
                          @{pr.writer.username}
                        </span>
                      </div>
                      {pr.writer.role === "REVOKED" && (
                        <Badge className="border-destructive/25 bg-destructive/5 text-destructive" variant="outline">
                          Đã gỡ quyền truy cập
                        </Badge>
                      )}
                      {!pr.postId || !pr.selectedPost ? (
                        <p className="text-xs font-medium italic text-text-secondary">Chưa chọn bài</p>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-text-secondary">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span className="truncate">{pr.selectedPost.title}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {pr.visibility === "PARTICIPANTS" ? (
                              <Badge
                                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Chia sẻ
                              </Badge>
                            ) : (
                              <Badge
                                className="border-border bg-muted text-muted-foreground hover:bg-muted text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Riêng tư
                              </Badge>
                            )}

                            {pr.status === "SUBMITTED" && (
                              <Badge
                                className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/15 text-[10px] px-2 py-0"
                                variant="outline"
                              >
                                Đã gửi
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end">
                    {pr.postId && pr.selectedPost && pr.visibility === "PARTICIPANTS" ? (
                      <Button asChild size="icon" variant="outline">
                        <Link
                          aria-label={`Xem bài dự thi của ${pr.writer.name}`}
                          href={`/dashboard/events/${id}/rooms/${pr.id}`}
                          title={`Xem bài dự thi của ${pr.writer.name}`}
                        >
                          <Eye aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : pr.postId && pr.selectedPost && pr.visibility === "PRIVATE" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-text-tertiary font-medium py-1">
                        <Lock className="h-3.5 w-3.5" />
                        Bài riêng tư
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
