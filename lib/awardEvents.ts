import type { JSONContent } from "@tiptap/react"

import { extractHeadings, type PostHeading } from "@/lib/postHeadings"

type AwardEventRoomStatus = "DRAFT" | "SUBMITTED"
type AwardEventSelectedPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED"

export interface AwardEventWriter {
  name: string
  username: string
}

export interface AwardEventPostRoom {
  id: string
  order: number
  selectedPost: {
    content: JSONContent
    id: string
    status: AwardEventSelectedPostStatus
    title: string
  } | null
  status: AwardEventRoomStatus
  writer: AwardEventWriter
}

export interface AwardEventPostContentInput {
  eventIntro: JSONContent | null
  rooms: AwardEventPostRoom[]
}

export interface OrderedAwardEventRoom {
  id: string
  order: number
}

export interface ShuffleableAwardEventRoom extends OrderedAwardEventRoom {
  excludedAt: Date | null
  status: AwardEventRoomStatus
}

export const emptyAwardEventDoc: JSONContent = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

function textNode(text: string): JSONContent {
  return { text, type: "text" }
}

function paragraph(text: string): JSONContent {
  return {
    content: [textNode(text)],
    type: "paragraph",
  }
}

function heading(level: number, text: string, id?: string): JSONContent {
  return {
    attrs: { ...(id && { id }), level },
    content: [textNode(text)],
    type: "heading",
  }
}

function listItem(text: string): JSONContent {
  return {
    content: [paragraph(text)],
    type: "listItem",
  }
}

function getDocContent(content: JSONContent | null | undefined) {
  if (!content || content.type !== "doc" || !Array.isArray(content.content)) {
    return []
  }

  return content.content
}

function getSectionId(room: AwardEventPostRoom) {
  return `event-room-${room.id}`
}

export function getSubmittedAwardEventRooms<TRoom extends AwardEventPostRoom>(
  rooms: TRoom[],
) {
  return [...rooms]
    .filter(
      (room) =>
        room.status === "SUBMITTED" &&
        room.selectedPost &&
        room.selectedPost.status !== "REMOVED",
    )
    .sort((a, b) => a.order - b.order || a.writer.name.localeCompare(b.writer.name))
}

export function buildAwardEventOutline(rooms: AwardEventPostRoom[]): PostHeading[] {
  return getSubmittedAwardEventRooms(rooms).flatMap((room) => {
    const seen = new Map<string, number>()

    return [
      {
        id: getSectionId(room),
        level: 1,
        text: room.writer.name,
      },
      ...extractHeadings(room.selectedPost?.content ?? emptyAwardEventDoc).map(
        (heading) => {
          const baseId = `${getSectionId(room)}-${heading.id}`
          const occurrence = (seen.get(baseId) ?? 0) + 1
          seen.set(baseId, occurrence)

          return {
            ...heading,
            id: occurrence === 1 ? baseId : `${baseId}-${occurrence}`,
            level: Math.max(2, heading.level),
          }
        },
      ),
    ]
  })
}

export function namespaceAwardEventPostContent(
  content: JSONContent,
  roomId: string,
): JSONContent {
  const seen = new Map<string, number>()

  function transform(node: JSONContent): JSONContent {
    const transformedContent = node.content?.map(transform)

    if (node.type !== "heading") {
      return { ...node, ...(transformedContent && { content: transformedContent }) }
    }

    const heading = extractHeadings({ ...node, content: transformedContent })[0]
    const baseId = `event-room-${roomId}-${heading?.id ?? "section"}`
    const occurrence = (seen.get(baseId) ?? 0) + 1
    seen.set(baseId, occurrence)
    const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2

    return {
      ...node,
      attrs: {
        ...node.attrs,
        id: occurrence === 1 ? baseId : `${baseId}-${occurrence}`,
        level,
      },
      ...(transformedContent && { content: transformedContent }),
    }
  }

  return transform(content)
}

export function buildAwardEventPostContent({
  eventIntro,
  rooms,
}: AwardEventPostContentInput): JSONContent {
  const submittedRooms = getSubmittedAwardEventRooms(rooms)
  const content: JSONContent[] = [...getDocContent(eventIntro)]

  content.push(heading(2, "Entries", "entries"))

  if (submittedRooms.length > 0) {
    content.push({
      content: submittedRooms.map((room) => listItem(room.writer.name)),
      type: "bulletList",
    })
  } else {
    content.push(paragraph("No submitted entries yet."))
  }

  submittedRooms.forEach((room) => {
    content.push(heading(2, room.writer.name, getSectionId(room)))

    content.push(...getDocContent(room.selectedPost?.content))
  })

  return {
    ...emptyAwardEventDoc,
    content,
  }
}

export function flattenAwardEventText(content: JSONContent): string {
  const parts: string[] = []

  function visit(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text)
    }

    node.content?.forEach(visit)
  }

  visit(content)

  return parts.join(" ").replace(/\s+/g, " ").trim()
}

export function shuffleAwardEventRooms<T extends OrderedAwardEventRoom>(
  rooms: T[],
  random: () => number = Math.random,
) {
  const shuffled = [...rooms]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]
    shuffled[index] = swap
    shuffled[swapIndex] = current
  }

  if (
    shuffled.length > 1 &&
    shuffled.every((room, index) => room.id === rooms[index]?.id)
  ) {
    shuffled.push(shuffled.shift()!)
  }

  return shuffled.map((room, order) => ({ ...room, order }))
}

export function shuffleSubmittedAwardEventRooms<T extends ShuffleableAwardEventRoom>(
  rooms: T[],
  random: () => number = Math.random,
) {
  const submitted = rooms.filter(
    (room) => room.status === "SUBMITTED" && !room.excludedAt,
  )
  const remaining = rooms.filter(
    (room) => room.status !== "SUBMITTED" || room.excludedAt,
  )

  return [...shuffleAwardEventRooms(submitted, random), ...remaining].map(
    (room, order) => ({ ...room, order }),
  )
}

export function reorderAwardEventRooms<T extends OrderedAwardEventRoom>(
  rooms: T[],
  roomId: string,
  targetRoomId: string,
) {
  const currentIndex = rooms.findIndex((room) => room.id === roomId)
  const targetIndex = rooms.findIndex((room) => room.id === targetRoomId)

  if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) {
    return rooms
  }

  const reordered = [...rooms]
  const [draggedRoom] = reordered.splice(currentIndex, 1)
  reordered.splice(targetIndex, 0, draggedRoom)

  return reordered.map((room, order) => ({ ...room, order }))
}
