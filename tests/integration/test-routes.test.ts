import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    newsletterSubscriber: {
      findUnique: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
  }

  return { encodeJwt: vi.fn(), prisma }
})

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@auth/core/jwt", () => ({ encode: mocks.encodeJwt }))

import { POST as login } from "@/app/api/test/login/route"
import { GET as getNewsletterToken } from "@/app/api/test/newsletter-token/route"

function postRequest(body: unknown) {
  return new Request("http://localhost/api/test/login", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("test-only API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("AUTH_SECRET", "test-secret")
    mocks.prisma.$transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback !== "function") {
        throw new Error("Expected transaction callback")
      }

      return (callback as (tx: typeof mocks.prisma) => Promise<unknown>)(
        mocks.prisma,
      )
    })
    mocks.prisma.user.upsert.mockResolvedValue({
      avatarUrl: null,
      email: "test-writer@example.com",
      id: "writer-1",
      name: "Test Writer",
      role: "WRITER",
      username: "test-writer",
    })
    mocks.encodeJwt.mockResolvedValue("encoded-test-jwt")
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue({
      token: "subscriber-token",
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("creates a JWT session cookie for a test writer", async () => {
    const response = await login(postRequest({ role: "WRITER" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { role: "WRITER", userId: "writer-1" },
    })
    expect(response.headers.get("set-cookie")).toContain(
      "authjs.session-token=encoded-test-jwt",
    )
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(mocks.prisma.user.upsert).toHaveBeenCalledWith({
      create: {
        email: "test-writer@example.com",
        name: "Test Writer",
        role: "WRITER",
        username: "test-writer",
      },
      select: { avatarUrl: true, id: true, role: true, username: true },
      update: {
        name: "Test Writer",
        role: "WRITER",
        username: "test-writer",
      },
      where: { email: "test-writer@example.com" },
    })
    expect(mocks.encodeJwt).toHaveBeenCalledWith({
      maxAge: 60 * 60 * 24 * 7,
      salt: "authjs.session-token",
      secret: "test-secret",
      token: {
        avatarUrl: null,
        role: "WRITER",
        sub: "writer-1",
        username: "test-writer",
      },
    })
  })

  it("hides the test login route outside NODE_ENV=test", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const response = await login(postRequest({ role: "WRITER" }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Not found" })
    expect(mocks.prisma.user.upsert).not.toHaveBeenCalled()
  })

  it("allows the explicit Playwright dev-server gate", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("PLAYWRIGHT_TEST", "1")

    const response = await login(postRequest({ role: "WRITER" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { role: "WRITER", userId: "writer-1" },
    })
  })

  it("returns a newsletter subscriber token for E2E unsubscribe tests", async () => {
    const response = await getNewsletterToken(
      new Request(
        "http://localhost/api/test/newsletter-token?email=Reader@Example.com",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { token: "subscriber-token" },
    })
    expect(mocks.prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      select: { token: true },
      where: { email: "reader@example.com" },
    })
  })

  it("hides the newsletter token route outside NODE_ENV=test", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const response = await getNewsletterToken(
      new Request(
        "http://localhost/api/test/newsletter-token?email=reader@example.com",
      ),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Not found" })
    expect(mocks.prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled()
  })
})
