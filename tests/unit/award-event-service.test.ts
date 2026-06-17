import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    awardEvent: {
      findUnique: vi.fn(),
    },
    awardEventRoom: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
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
