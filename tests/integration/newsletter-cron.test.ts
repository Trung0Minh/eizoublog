import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  processNewsletterQueue: vi.fn(),
}))

vi.mock("@/lib/newsletterQueue", () => ({
  processNewsletterQueue: mocks.processNewsletterQueue,
}))

import { GET } from "@/app/api/cron/newsletter/route"

function cronRequest(secret?: string) {
  return new Request("https://animeblog.example/api/cron/newsletter", {
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  })
}

describe("GET /api/cron/newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "cron-secret-value"
    mocks.processNewsletterQueue.mockResolvedValue({
      claimed: 2,
      failed: 0,
      sent: 2,
    })
  })

  it("rejects requests without the configured bearer secret", async () => {
    const response = await GET(cronRequest())

    expect(response.status).toBe(401)
    expect(mocks.processNewsletterQueue).not.toHaveBeenCalled()
  })

  it("processes queued recipients for authorized cron requests", async () => {
    const response = await GET(cronRequest("cron-secret-value"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { claimed: 2, failed: 0, sent: 2 },
    })
    expect(mocks.processNewsletterQueue).toHaveBeenCalledOnce()
  })
})
