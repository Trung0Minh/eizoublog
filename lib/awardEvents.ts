import type { JSONContent } from "@tiptap/react"

type AwardEventRoomStatus = "DRAFT" | "SUBMITTED"

export interface AwardEventWriter {
  name: string
  username: string
}

export interface AwardEventPostRoom {
  content: JSONContent
  id: string
  order: number
  status: AwardEventRoomStatus
  writer: AwardEventWriter
  writerIntro: string | null
}

export interface AwardEventPostContentInput {
  eventIntro: JSONContent | null
  rooms: AwardEventPostRoom[]
}

export interface OrderedAwardEventRoom {
  id: string
  order: number
}

export const emptyAwardEventDoc: JSONContent = {
  content: [],
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

function blockquote(text: string): JSONContent {
  return {
    content: [paragraph(text)],
    type: "blockquote",
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

export function getSubmittedAwardEventRooms(rooms: AwardEventPostRoom[]) {
  return [...rooms]
    .filter((room) => room.status === "SUBMITTED")
    .sort((a, b) => a.order - b.order || a.writer.name.localeCompare(b.writer.name))
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

    if (room.writerIntro?.trim()) {
      content.push(blockquote(room.writerIntro.trim()))
    }

    content.push(...getDocContent(room.content))
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

export function shuffleAwardEventRooms(
  rooms: OrderedAwardEventRoom[],
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

  return shuffled.map((room, order) => ({ ...room, order }))
}
