import type { PrismaClient } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"

import {
  cn,
  ensureUniqueSlug,
  formatDate,
  formatExactDateTime,
  generateSlug,
} from "@/lib/utils"

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe(
      "text-sm px-4",
    )
  })
})

describe("generateSlug", () => {
  it("normalizes Vietnamese text and removes punctuation", () => {
    expect(generateSlug("Đánh giá Frieren's Animation!")).toBe(
      "danh-gia-frierens-animation",
    )
  })

  it("collapses repeated whitespace", () => {
    expect(generateSlug("Vinland  Saga   OST")).toBe("vinland-saga-ost")
  })
})

describe("formatDate", () => {
  it("shows relative seconds for dates within a minute", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-18T11:59:42.000Z"))).toBe("18 giây trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows relative minutes for dates within an hour", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-18T11:38:00.000Z"))).toBe("22 phút trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows relative hours for dates within 24 hours", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-18T09:30:00.000Z"))).toBe("2 giờ trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows relative days for dates within a month", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-16T10:00:00.000Z"))).toBe("2 ngày trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows relative months for dates within a year", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-04-18T12:00:00.000Z"))).toBe("2 tháng trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows relative years for older dates", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2024-06-18T12:00:00.000Z"))).toBe("2 năm trước")
    } finally {
      vi.useRealTimers()
    }
  })

  it("accepts date strings", () => {
    expect(() => formatDate("2024-04-01")).not.toThrow()
  })

  it("formats exact date time for timestamp titles", () => {
    expect(formatExactDateTime(new Date(2026, 5, 20, 12, 42))).toBe(
      "20/06/2026 12:42",
    )
  })
})

describe("ensureUniqueSlug", () => {
  it("appends a counter until the slug is available", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: "post-1" })
      .mockResolvedValueOnce({ id: "post-2" })
      .mockResolvedValueOnce(null)
    const prisma = {
      post: { findUnique },
    } as unknown as PrismaClient

    await expect(ensureUniqueSlug("frieren", prisma)).resolves.toBe("frieren-2")
    expect(findUnique).toHaveBeenCalledTimes(3)
  })

  it("allows the excluded post to keep its slug", async () => {
    const prisma = {
      post: {
        findUnique: vi.fn().mockResolvedValue({ id: "post-1" }),
      },
    } as unknown as PrismaClient

    await expect(ensureUniqueSlug("frieren", prisma, "post-1")).resolves.toBe(
      "frieren",
    )
  })
})
