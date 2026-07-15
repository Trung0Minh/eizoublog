import { beforeEach, describe, expect, it, vi } from "vitest"

const awsMocks = vi.hoisted(() => ({
  clientOptions: undefined as unknown,
  deleteObjectsInput: undefined as unknown,
  putObjectInput: undefined as unknown,
  send: vi.fn(),
}))

vi.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectsCommand: vi.fn(function DeleteObjectsCommand(input: unknown) {
    awsMocks.deleteObjectsInput = input
    return { input }
  }),
  PutObjectCommand: vi.fn(function PutObjectCommand(input: unknown) {
    awsMocks.putObjectInput = input
    return { input }
  }),
  S3Client: vi.fn(function S3Client(options: unknown) {
    awsMocks.clientOptions = options
    return { send: awsMocks.send }
  }),
}))

async function importR2() {
  vi.resetModules()
  return import("@/lib/r2")
}

describe("uploadToR2", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    awsMocks.clientOptions = undefined
    awsMocks.deleteObjectsInput = undefined
    awsMocks.putObjectInput = undefined
    process.env.R2_ACCOUNT_ID = "account-id"
    process.env.R2_ACCESS_KEY_ID = "access-key"
    process.env.R2_SECRET_ACCESS_KEY = "secret-key"
    process.env.R2_BUCKET_NAME = "animeblog"
    process.env.R2_PUBLIC_URL = "https://cdn.example.com"
    awsMocks.send.mockResolvedValue({})
  })

  it("uploads an object to R2 and returns its public URL", async () => {
    const { uploadToR2 } = await importR2()
    const body = Buffer.from("gif-bytes")

    await expect(
      uploadToR2({
        key: "content-images/example.gif",
        body,
        contentType: "image/gif",
      }),
    ).resolves.toBe("https://cdn.example.com/content-images/example.gif")

    expect(awsMocks.clientOptions).toEqual({
      credentials: {
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
      },
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      region: "auto",
    })
    expect(awsMocks.putObjectInput).toEqual({
      Body: body,
      Bucket: "animeblog",
      ContentType: "image/gif",
      Key: "content-images/example.gif",
    })
    expect(awsMocks.send).toHaveBeenCalledOnce()
  })

  it("fails fast when R2 environment variables are missing", async () => {
    delete process.env.R2_BUCKET_NAME
    const { uploadToR2 } = await importR2()

    await expect(
      uploadToR2({
        key: "content-images/example.gif",
        body: Buffer.from("gif-bytes"),
        contentType: "image/gif",
      }),
    ).rejects.toThrow("Cloudflare R2 environment variables are not configured")
  })

  it("deletes only objects hosted by the configured R2 public URL", async () => {
    const { deleteR2Objects } = await importR2()

    await deleteR2Objects([
      "https://cdn.example.com/covers/cover.webp?crop=wide",
      "https://cdn.example.com/content-images/frame.jpg",
      "https://cdn.example.com/content-images/frame.jpg",
      "https://images.example.org/external.jpg",
    ])

    expect(awsMocks.deleteObjectsInput).toEqual({
      Bucket: "animeblog",
      Delete: {
        Objects: [
          { Key: "covers/cover.webp" },
          { Key: "content-images/frame.jpg" },
        ],
        Quiet: true,
      },
    })
  })

  it("does not contact R2 when no configured objects are present", async () => {
    const { deleteR2Objects } = await importR2()

    await deleteR2Objects(["https://images.example.org/external.jpg"])

    expect(awsMocks.send).not.toHaveBeenCalled()
  })

  it("fails when R2 reports an object-level deletion error", async () => {
    const { deleteR2Objects } = await importR2()
    awsMocks.send.mockResolvedValueOnce({
      Errors: [{ Code: "AccessDenied", Key: "covers/cover.webp" }],
    })

    await expect(
      deleteR2Objects(["https://cdn.example.com/covers/cover.webp"]),
    ).rejects.toThrow("Cloudflare R2 failed to delete one or more objects")
  })
})
