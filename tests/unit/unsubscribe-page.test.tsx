import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}))

import UnsubscribePage from "@/app/(public)/unsubscribe/page"

describe("UnsubscribePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders an invalid link message when no token is provided", async () => {
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Liên kết không hợp lệ")
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("renders an invalid link message for an unknown token", async () => {
    mocks.findUnique.mockResolvedValue(null)

    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "missing-token" }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Liên kết không hợp lệ")
    expect(mocks.findUnique).toHaveBeenCalledWith({
      select: { status: true, token: true },
      where: { token: "missing-token" },
    })
  })

  it("marks active subscribers unsubscribed on page load", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "ACTIVE",
      token: "subscriber-token",
    })

    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "subscriber-token" }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Bạn đã được hủy đăng ký")
    expect(mocks.update).toHaveBeenCalledWith({
      data: { status: "UNSUBSCRIBED", unsubscribedAt: expect.any(Date) },
      select: { token: true },
      where: { token: "subscriber-token" },
    })
  })

  it("does not update already unsubscribed subscribers", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "UNSUBSCRIBED",
      token: "subscriber-token",
    })

    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "subscriber-token" }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Đã hủy đăng ký")
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
