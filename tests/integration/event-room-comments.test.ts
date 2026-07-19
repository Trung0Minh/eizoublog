import { beforeEach, describe, expect, it, vi } from "vitest"

type PrismaCall = Record<string, unknown>

const mocks = vi.hoisted(() => {
  const prisma = {
    awardEventRoom: {
      findUnique: vi.fn(),
    },
    awardEventRoomComment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  }

  return {
    auth: vi.fn(),
    prisma,
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import { GET, POST } from "@/app/api/events/[id]/rooms/[roomId]/comments/route"

function jsonRequest(body: unknown) {
  return new Request("https://example.test/api/events/event-1/rooms/room-1/comments", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

function routeParams() {
  return { params: Promise.resolve({ id: "event-1", roomId: "room-1" }) }
}

describe("Event Room Comments API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockResolvedValue(null)

    // Default room setup: room-1 exists in event-1, writer is owner-1, visibility is PARTICIPANTS
    mocks.prisma.awardEventRoom.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === "room-1") {
        return {
          event: { status: "OPEN" },
          eventId: "event-1",
          id: "room-1",
          visibility: "PARTICIPANTS",
          writerId: "owner-1",
        }
      }
      if (where.eventId_writerId) {
        const { writerId } = where.eventId_writerId
        if (writerId === "participant-1") {
          return { id: "room-participant" }
        }
      }
      return null
    })
  })

  describe("Authentication & Access", () => {
    it("returns 401 if user is not logged in", async () => {
      const response = await GET(
        new Request("https://example.test/api/events/event-1/rooms/room-1/comments"),
        routeParams()
      )
      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    })

    it("returns 404 if room does not exist", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner-1" } })
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: "owner-1",
        role: "WRITER",
      })
      mocks.prisma.awardEventRoom.findUnique.mockResolvedValue(null)

      const response = await GET(
        new Request("https://example.test/api/events/event-1/rooms/room-1/comments"),
        routeParams()
      )
      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: "Room not found" })
    })
  })

  describe("GET /api/events/[id]/rooms/[roomId]/comments", () => {
    const commentsList = [
      {
        id: "comment-1",
        content: "Public comment",
        isPrivate: false,
        createdAt: new Date("2026-06-17T01:00:00Z"),
        authorId: "participant-1",
        author: { name: "Participant", username: "participant" },
      },
      {
        id: "comment-2",
        content: "Private comment by participant",
        isPrivate: true,
        createdAt: new Date("2026-06-17T02:00:00Z"),
        authorId: "participant-1",
        author: { name: "Participant", username: "participant" },
      },
      {
        id: "comment-3",
        content: "Private comment by owner",
        isPrivate: true,
        createdAt: new Date("2026-06-17T03:00:00Z"),
        authorId: "owner-1",
        author: { name: "Owner", username: "owner" },
      },
    ]

    it("allows Admin to see all comments without privacy restrictions", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "admin-1" } })
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
      })
      mocks.prisma.awardEventRoomComment.findMany.mockResolvedValue(commentsList)

      const response = await GET(
        new Request("https://example.test/api/events/event-1/rooms/room-1/comments"),
        routeParams()
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data.comments).toHaveLength(3)

      const findManyCall = mocks.prisma.awardEventRoomComment.findMany.mock.calls[0]?.[0] as PrismaCall
      expect(findManyCall.where).toEqual({ roomId: "room-1" })
    })

    it("allows Room Owner to see all comments without privacy restrictions", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner-1" } })
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: "owner-1",
        role: "WRITER",
      })
      mocks.prisma.awardEventRoomComment.findMany.mockResolvedValue(commentsList)

      const response = await GET(
        new Request("https://example.test/api/events/event-1/rooms/room-1/comments"),
        routeParams()
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data.comments).toHaveLength(3)

      const findManyCall = mocks.prisma.awardEventRoomComment.findMany.mock.calls[0]?.[0] as PrismaCall
      expect(findManyCall.where).toEqual({ roomId: "room-1" })
    })

    it("restricts participant to public comments and their own private comments", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "participant-1" } })
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: "participant-1",
        role: "WRITER",
      })

      // Simulating database return after filter is applied
      const filteredComments = commentsList.filter(
        c => !c.isPrivate || c.authorId === "participant-1"
      )
      mocks.prisma.awardEventRoomComment.findMany.mockResolvedValue(filteredComments)

      const response = await GET(
        new Request("https://example.test/api/events/event-1/rooms/room-1/comments"),
        routeParams()
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data.comments).toHaveLength(2)

      const findManyCall = mocks.prisma.awardEventRoomComment.findMany.mock.calls[0]?.[0] as PrismaCall
      expect(findManyCall.where).toEqual({
        roomId: "room-1",
        OR: [
          { isPrivate: false },
          { isPrivate: true, authorId: "participant-1" },
        ],
      })
    })
  })

  describe("POST /api/events/[id]/rooms/[roomId]/comments", () => {
    beforeEach(() => {
      mocks.auth.mockResolvedValue({ user: { id: "participant-1" } })
      mocks.prisma.user.findUnique.mockResolvedValue({
        id: "participant-1",
        role: "WRITER",
      })
    })

    it("rejects new feedback after the event is closed", async () => {
      mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
        event: { status: "CLOSED" },
        eventId: "event-1",
        id: "room-1",
        visibility: "PARTICIPANTS",
        writerId: "owner-1",
      })

      const response = await POST(
        jsonRequest({ content: "Too late" }),
        routeParams(),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: "Event is closed" })
      expect(mocks.prisma.awardEventRoomComment.create).not.toHaveBeenCalled()
    })

    it("creates a public comment when isPrivate is omitted (defaults to false)", async () => {
      const dbComment = {
        id: "comment-new",
        content: "Awesome post!",
        isPrivate: false,
        createdAt: new Date("2026-06-17T04:00:00Z"),
        author: { name: "Participant", username: "participant" },
      }
      mocks.prisma.awardEventRoomComment.create.mockResolvedValue(dbComment)

      const response = await POST(
        jsonRequest({ content: "Awesome post!" }),
        routeParams()
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.data.isPrivate).toBe(false)

      const createCall = mocks.prisma.awardEventRoomComment.create.mock.calls[0]?.[0] as PrismaCall
      expect(createCall.data).toMatchObject({
        authorId: "participant-1",
        content: "Awesome post!",
        isPrivate: false,
        roomId: "room-1",
      })
    })

    it("creates a private comment when isPrivate is true", async () => {
      const dbComment = {
        id: "comment-new-private",
        content: "Confidential suggestion",
        isPrivate: true,
        createdAt: new Date("2026-06-17T04:05:00Z"),
        author: { name: "Participant", username: "participant" },
      }
      mocks.prisma.awardEventRoomComment.create.mockResolvedValue(dbComment)

      const response = await POST(
        jsonRequest({ content: "Confidential suggestion", isPrivate: true }),
        routeParams()
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.data.isPrivate).toBe(true)

      const createCall = mocks.prisma.awardEventRoomComment.create.mock.calls[0]?.[0] as PrismaCall
      expect(createCall.data).toMatchObject({
        authorId: "participant-1",
        content: "Confidential suggestion",
        isPrivate: true,
        roomId: "room-1",
      })
    })

    it("rejects empty content", async () => {
      const response = await POST(
        jsonRequest({ content: "  ", isPrivate: false }),
        routeParams()
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
      expect(mocks.prisma.awardEventRoomComment.create).not.toHaveBeenCalled()
    })
  })
})
