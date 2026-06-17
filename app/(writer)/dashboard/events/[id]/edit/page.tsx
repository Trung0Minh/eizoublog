import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { EventRoomEditor } from "@/components/events/EventRoomEditor"
import { joinAwardEvent } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/lib/session"

interface EditRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
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

  const eligiblePosts = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      title: true,
      updatedAt: true,
    },
    where: {
      authorId: session.user.id,
      status: { in: ["DRAFT", "PUBLISHED"] },
    },
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/dashboard/events/${id}`}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event Overview
        </Link>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          Edit submission
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{event.title}</h1>
      </div>

      <EventRoomEditor eligiblePosts={eligiblePosts} event={event} room={room} />
    </main>
  )
}
