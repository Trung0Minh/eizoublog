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
  regenerateAwardEventPost,
  unpublishAwardEventPost,
  updateAwardEventRoom,
} from "@/lib/awardEventService"

function updateInput(
  postId: string | null,
  overrides: Partial<Parameters<typeof updateAwardEventRoom>[0]> = {},
) {
  return {
    eventId: "event-1",
    postId,
    status: "SUBMITTED",
    visibility: "PARTICIPANTS",
    writerId: "writer-1",
    writerIntro: "Writer intro",
    ...overrides,
  } satisfies Parameters<typeof updateAwardEventRoom>[0]
}

function selectedPost(overrides: Record<string, unknown> = {}) {
  return {
    author: { bio: null },
    content: {
      content: [
        {
          content: [{ text: "Submitted snapshot", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    },
    id: "post-1",
    status: "DRAFT",
    title: "Selected post",
    version: 4,
    ...overrides,
  }
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
        awardEventRoom: {
          findUnique: mocks.prisma.awardEventRoom.findUnique,
          update: mocks.prisma.awardEventRoom.update,
        },
        post: {
          findFirst: mocks.prisma.post.findFirst,
          update: mocks.prisma.post.update,
        },
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

  it("rejects every writer room update after the event is closed", async () => {
    mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
      event: { status: "CLOSED" },
      id: "room-1",
    })

    await expect(updateAwardEventRoom(updateInput("post-1"))).rejects.toMatchObject({
      message: "Event is closed",
      status: 400,
    } satisfies Partial<AwardEventError>)
    expect(mocks.prisma.post.findFirst).not.toHaveBeenCalled()
  })

  it("captures an immutable snapshot when a writer submits", async () => {
    mocks.prisma.post.findFirst.mockResolvedValue(selectedPost())

    await updateAwardEventRoom(updateInput("post-1"))

    expect(mocks.prisma.awardEventRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: "post-1",
          submittedContent: selectedPost().content,
          submittedPostId: "post-1",
          submittedPostTitle: "Selected post",
          submittedPostVersion: 4,
          submittedWriterIntro: "Writer intro",
        }),
      }),
    )
  })

  it("falls back to visible public profile text when the submitted intro is blank", async () => {
    mocks.prisma.post.findFirst.mockResolvedValue(
      selectedPost({
        author: {
          bio: JSON.stringify({
            content: [
              {
                content: [{ text: "Anime editor", type: "text" }],
                type: "paragraph",
              },
              {
                content: [{ text: "and sakuga fan", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "doc",
          }),
        },
      }),
    )

    await updateAwardEventRoom(updateInput("post-1", { writerIntro: "   " }))

    expect(mocks.prisma.awardEventRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          submittedWriterIntro: "Anime editor and sakuga fan",
          writerIntro: null,
        }),
      }),
    )
  })

  it("does not replace the submitted snapshot during an ordinary room edit", async () => {
    mocks.prisma.post.findFirst.mockResolvedValue(selectedPost())

    await updateAwardEventRoom(updateInput("post-1", { status: undefined }))

    const update = mocks.prisma.awardEventRoom.update.mock.calls[0]?.[0]
    expect(update.data).not.toHaveProperty("submittedContent")
    expect(update.data).not.toHaveProperty("submittedPostVersion")
    expect(update.data).not.toHaveProperty("submittedWriterIntro")
  })

  it("regenerates an existing published anthology while the event is open", async () => {
    const longIntroduction = "Event introduction ".repeat(40).trim()
    mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
      event: { status: "OPEN" },
      id: "room-1",
    })
    mocks.prisma.post.findFirst.mockResolvedValue(selectedPost())
    mocks.prisma.awardEvent.findUnique
      .mockResolvedValueOnce({ finalPostId: "final-post-1", status: "OPEN" })
      .mockResolvedValueOnce({
        categoryId: null,
        coverAlt: null,
        coverUrl: null,
        createdById: "admin-1",
        finalPostId: "final-post-1",
        finalPost: { id: "final-post-1", slug: "awards", status: "PUBLISHED" },
        id: "event-1",
        intro: { content: [], type: "doc" },
        introText: longIntroduction,
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
            submittedContent: selectedPost().content,
            submittedPostId: "post-1",
            submittedPostTitle: "Selected post",
            submittedPostVersion: 4,
            submittedWriterIntro: "Writer intro",
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
          excerpt: `${longIntroduction.slice(0, 499).trimEnd()}…`,
          status: "PUBLISHED",
          title: "Awards",
        }),
        where: { id: "final-post-1" },
      }),
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/awards")
  })
})

describe("regenerateAwardEventPost", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        awardEvent: { update: mocks.prisma.awardEvent.update },
        post: { update: mocks.prisma.post.update },
      }),
    )
  })

  it("builds the event article from the submitted snapshot instead of live draft content", async () => {
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      categoryId: null,
      coverAlt: null,
      coverUrl: null,
      createdById: "admin-1",
      finalPostId: "final-post-1",
      finalPost: { id: "final-post-1", slug: "awards", status: "PUBLISHED" },
      id: "event-1",
      intro: { content: [], type: "doc" },
      introText: "Event introduction",
      rooms: [
        {
          excludedAt: null,
          id: "room-1",
          order: 0,
          selectedPost: {
            content: {
              content: [
                {
                  content: [{ text: "Unsaved event update", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "doc",
            },
            id: "post-1",
            status: "DRAFT",
            title: "Live draft",
          },
          status: "SUBMITTED",
          submittedContent: selectedPost().content,
          submittedPostId: "post-1",
          submittedPostTitle: "Selected post",
          submittedPostVersion: 4,
          submittedWriterIntro: null,
          writer: {
            bio: "Public profile introduction",
            name: "Mai",
            username: "mai",
          },
          writerIntro: "Changed introduction",
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

    await regenerateAwardEventPost("event-1")

    const update = mocks.prisma.post.update.mock.calls[0]?.[0]
    const generatedContent = JSON.stringify(update.data.content)
    expect(generatedContent).toContain("Submitted snapshot")
    expect(generatedContent).toContain("Public profile introduction")
    expect(generatedContent).not.toContain("Unsaved event update")
    expect(generatedContent).not.toContain("Changed introduction")
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
    expect(adminAwardEventDetailSelect.rooms.select.submittedContent).toBe(false)
  })
})

describe("unpublishAwardEventPost", () => {
  it("keeps the generated article but returns it to an editable draft", async () => {
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      finalPostId: "final-post-1",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "final-post-1",
      slug: "awards",
      status: "DRAFT",
    })

    await expect(unpublishAwardEventPost("event-1")).resolves.toMatchObject({
      status: "DRAFT",
    })
    expect(mocks.prisma.post.update).toHaveBeenCalledWith({
      data: {
        moderationLockedAt: null,
        publishedAt: null,
        removedAt: null,
        removedFromStatus: null,
        status: "DRAFT",
      },
      select: { id: true, slug: true, status: true },
      where: { id: "final-post-1" },
    })
  })
})
