import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"

export const WRITER_EVENT_SEEN_COOKIE = "writer_event_seen_ids"

const SEEN_EVENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export function parseSeenEventIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

function serializeSeenEventIds(ids: Set<string>) {
  return Array.from(ids).sort().join(",")
}

export async function getOpenUnjoinedEventIds(userId: string) {
  const events = await prisma.awardEvent.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true },
    where: {
      rooms: { none: { writerId: userId } },
      status: "OPEN",
    },
  })

  return events.map((event) => event.id)
}

export async function getUnseenOpenEventCount(userId: string) {
  const [openEventIds, cookieStore] = await Promise.all([
    getOpenUnjoinedEventIds(userId),
    cookies(),
  ])
  const seenEventIds = parseSeenEventIds(
    cookieStore.get(WRITER_EVENT_SEEN_COOKIE)?.value,
  )

  return openEventIds.filter((eventId) => !seenEventIds.has(eventId)).length
}

export async function markOpenEventsSeen(userId: string) {
  const [openEventIds, cookieStore] = await Promise.all([
    getOpenUnjoinedEventIds(userId),
    cookies(),
  ])
  const seenEventIds = parseSeenEventIds(
    cookieStore.get(WRITER_EVENT_SEEN_COOKIE)?.value,
  )

  for (const eventId of openEventIds) {
    seenEventIds.add(eventId)
  }

  cookieStore.set(WRITER_EVENT_SEEN_COOKIE, serializeSeenEventIds(seenEventIds), {
    httpOnly: true,
    maxAge: SEEN_EVENT_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  })

  return { count: 0 }
}
