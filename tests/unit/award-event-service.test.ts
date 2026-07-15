import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    awardEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    awardEventRoom: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import {
  AwardEventError,
  adminAwardEventDetailSelect,
  updateAwardEventRoom,
} from "@/lib/awardEventService"

function updateInput(postId: string | null) {
  return {
    eventId: "event-1",
    postId,
    status: "SUBMITTED",
    visibility: "PARTICIPANTS",
    writerId: "writer-1",
    writerIntro: "Writer intro",
  } satisfies Parameters<typeof updateAwardEventRoom>[0]
}

describe("updateAwardEventRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
      event: { status: "OPEN" },
      id: "room-1",
    })
    mocks.prisma.awardEventRoom.update.mockResolvedValue({
      id: "room-1",
      postId: "post-1",
    })
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      finalPostId: null,
      status: "OPEN",
    })
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        awardEvent: { update: mocks.prisma.awardEvent.update },
        post: { update: mocks.prisma.post.update },
      }),
    )
  })

  it("rejects a selected post that is not an owned draft or published post", async () => {
    mocks.prisma.post.findFirst.mockResolvedValue(null)

    await expect(updateAwardEventRoom(updateInput("post-2"))).rejects.toMatchObject({
      message: "Selected post not found",
      status: 404,
    } satisfies Partial<AwardEventError>)
  })

  it("saves the selected post id when the writer owns an eligible post", async () => {
    mocks.prisma.post.findFirst.mockResolvedValue({
      id: "post-1",
      status: "DRAFT",
    })

    await updateAwardEventRoom(updateInput("post-1"))

    expect(mocks.prisma.post.findFirst).toHaveBeenCalledWith({
      select: { id: true, status: true },
      where: {
        authorId: "writer-1",
        id: "post-1",
        status: { in: ["DRAFT", "PUBLISHED"] },
      },
    })
    expect(mocks.prisma.awardEventRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: "post-1",
        }),
      }),
    )
  })

  it("regenerates an already-published anthology when a writer submits later", async () => {
    mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
      event: { status: "PUBLISHED" },
      id: "room-1",
    })
    mocks.prisma.post.findFirst.mockResolvedValue({ id: "post-1", status: "DRAFT" })
    mocks.prisma.awardEvent.findUnique
      .mockResolvedValueOnce({ finalPostId: "final-post-1", status: "PUBLISHED" })
      .mockResolvedValueOnce({
        categoryId: null,
        coverAlt: null,
        coverUrl: null,
        createdById: "admin-1",
        finalPostId: "final-post-1",
        id: "event-1",
        intro: { content: [], type: "doc" },
        introText: "Event introduction",
        publishedAt: new Date("2026-06-01T00:00:00.000Z"),
        rooms: [
          {
            excludedAt: null,
            id: "room-1",
            order: 0,
            selectedPost: {
              content: {
                content: [
                  {
                    content: [{ text: "Late submission", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "doc",
              },
              id: "post-1",
              status: "DRAFT",
              title: "Late entry",
            },
            status: "SUBMITTED",
            writer: { name: "Mai", username: "mai" },
            writerIntro: "Writer intro",
          },
        ],
        slug: "awards",
        tags: [],
        title: "Awards",
      })
    mocks.prisma.post.update.mockResolvedValue({
      id: "final-post-1",
      slug: "awards",
      status: "PUBLISHED",
    })

    await updateAwardEventRoom(updateInput("post-1"))

    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PUBLISHED",
          title: "Awards",
        }),
        where: { id: "final-post-1" },
      }),
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/awards")
  })
})

describe("adminAwardEventDetailSelect", () => {
  it("keeps selected post payloads lightweight for admin event navigation", () => {
    const selectedPostSelect =
      adminAwardEventDetailSelect.rooms.select.selectedPost.select

    expect(selectedPostSelect).toMatchObject({
      id: true,
      status: true,
      title: true,
    })
    expect(selectedPostSelect).not.toHaveProperty("content")
  })
})
