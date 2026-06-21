import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  nanoid: vi.fn(() => "file-id"),
  userFindUnique: vi.fn(),
  uploadToR2: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))
vi.mock("@/lib/r2", () => ({ uploadToR2: mocks.uploadToR2 }))
vi.mock("nanoid", () => ({ nanoid: mocks.nanoid }))

import { POST as upload } from "@/app/api/upload/route"

function uploadRequest(file?: File | File[], folder = "content-images") {
  const form = new FormData()

  if (Array.isArray(file)) {
    file.forEach((item) => form.append("file", item))
  } else if (file) {
    form.append("file", file)
  }
  form.append("folder", folder)

  return {
    formData: () => Promise.resolve(form),
  } as Request
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      role: "WRITER",
      username: "writer",
    })
    mocks.nanoid.mockReset()
    mocks.nanoid.mockReturnValue("file-id")
    mocks.uploadToR2.mockResolvedValue(
      "https://cdn.example.com/content-images/file-id.gif",
    )
  })

  it("rejects unauthenticated uploads", async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await upload(
      uploadRequest(new File(["gif"], "scene.gif", { type: "image/gif" })),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("requires a file", async () => {
    const response = await upload(uploadRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "No file provided",
    })
  })

  it("rejects non-image files", async () => {
    const response = await upload(
      uploadRequest(new File(["text"], "notes.txt", { type: "text/plain" })),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Only JPEG, PNG, GIF, WebP images and MP4, WebM videos are allowed",
    })
  })

  it("rejects non-GIF images larger than 5 MB", async () => {
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1)
    const response = await upload(
      uploadRequest(new File([bytes], "huge.webp", { type: "image/webp" })),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "File must be 5 MB or smaller",
    })
  })

  it("keeps the 10 MB limit for GIF uploads", async () => {
    const bytes = new Uint8Array(10 * 1024 * 1024 + 1)
    const response = await upload(
      uploadRequest(new File([bytes], "huge.gif", { type: "image/gif" })),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "File must be 10 MB or smaller",
    })
  })

  it("uploads an allowed image to R2", async () => {
    const response = await upload(
      uploadRequest(new File(["gif"], "Scene.GIF", { type: "image/gif" })),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { url: "https://cdn.example.com/content-images/file-id.gif" },
    })
    expect(mocks.uploadToR2).toHaveBeenCalledWith({
      body: expect.any(Buffer),
      contentType: "image/gif",
      key: "content-images/file-id.gif",
    })
  })

  it("uploads multiple allowed images to R2", async () => {
    mocks.nanoid
      .mockReturnValueOnce("frame-a")
      .mockReturnValueOnce("frame-b")
    mocks.uploadToR2
      .mockResolvedValueOnce("https://cdn.example.com/content-images/frame-a.webp")
      .mockResolvedValueOnce("https://cdn.example.com/content-images/frame-b.gif")

    const response = await upload(
      uploadRequest([
        new File(["webp"], "frame-a.webp", { type: "image/webp" }),
        new File(["gif"], "frame-b.gif", { type: "image/gif" }),
      ]),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: {
        files: [
          { url: "https://cdn.example.com/content-images/frame-a.webp" },
          { url: "https://cdn.example.com/content-images/frame-b.gif" },
        ],
      },
    })
    expect(mocks.uploadToR2).toHaveBeenNthCalledWith(1, {
      body: expect.any(Buffer),
      contentType: "image/webp",
      key: "content-images/frame-a.webp",
    })
    expect(mocks.uploadToR2).toHaveBeenNthCalledWith(2, {
      body: expect.any(Buffer),
      contentType: "image/gif",
      key: "content-images/frame-b.gif",
    })
  })

  it("falls back to a safe folder and MIME extension for unsafe names", async () => {
    const response = await upload(
      uploadRequest(new File(["png"], "image", { type: "image/png" }), "../bad"),
    )

    expect(response.status).toBe(201)
    expect(mocks.uploadToR2).toHaveBeenCalledWith({
      body: expect.any(Buffer),
      contentType: "image/png",
      key: "uploads/file-id.png",
    })
  })
})
