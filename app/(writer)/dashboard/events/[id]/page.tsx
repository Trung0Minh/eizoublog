import type { JSONContent } from "@tiptap/react"
import { notFound, redirect } from "next/navigation"

import { EventRoomEditor } from "@/components/events/EventRoomEditor"
import { joinAwardEvent, normalizeAwardEventContent } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/lib/session"

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
          content: true,
          contentText: true,
          id: true,
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

  if (!event || (event.status !== "OPEN" && event.status !== "PUBLISHED")) {
    notFound()
  }

  if (!event.rooms[0]) {
    await joinAwardEvent(id, session.user.id)
    event = await prisma.awardEvent.findUnique({
      select: {
        finalPost: { select: { slug: true } },
        id: true,
        rooms: {
          select: {
            content: true,
            contentText: true,
            id: true,
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

  const sharedRooms = await prisma.awardEventRoom.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
    select: {
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          author: { select: { name: true, username: true } },
          content: true,
          createdAt: true,
          id: true,
        },
      },
      content: true,
      id: true,
      status: true,
      writer: { select: { name: true, username: true } },
      writerIntro: true,
    },
    where: {
      eventId: id,
      visibility: "PARTICIPANTS",
      writerId: { not: session.user.id },
    },
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Event room
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
      </div>
      <EventRoomEditor
        event={event}
        room={{
          ...room,
          content: normalizeAwardEventContent(room.content) as JSONContent,
        }}
        sharedRooms={sharedRooms.map((sharedRoom) => ({
          ...sharedRoom,
          content: normalizeAwardEventContent(sharedRoom.content) as JSONContent,
        }))}
      />
    </main>
  )
}
