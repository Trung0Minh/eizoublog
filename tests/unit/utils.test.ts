import type { PrismaClient } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"

import { cn, ensureUniqueSlug, formatDate, generateSlug } from "@/lib/utils"

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

  it("shows yesterday for dates between 24 and 48 hours ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-17T10:00:00.000Z"))).toBe("Hôm qua")
    } finally {
      vi.useRealTimers()
    }
  })

  it("formats older dates as dd/mm/yy", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"))

    try {
      expect(formatDate(new Date("2026-06-16T00:00:00.000Z"))).toBe("16/06/26")
    } finally {
      vi.useRealTimers()
    }
  })

  it("accepts date strings", () => {
    expect(() => formatDate("2024-04-01")).not.toThrow()
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
