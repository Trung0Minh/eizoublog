import type { PrismaClient } from "@prisma/client"
import { clsx, type ClassValue } from "clsx"
import { slug as githubSlug } from "github-slugger"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const value = new Date(date)
  const diffMs = Date.now() - value.getTime()
  const secondMs = 1000
  const minuteMs = 60 * secondMs
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (diffMs >= 0 && diffMs < minuteMs) {
    const seconds = Math.max(1, Math.floor(diffMs / secondMs))
    return `${seconds} giây trước`
  }

  if (diffMs >= minuteMs && diffMs < hourMs) {
    const minutes = Math.floor(diffMs / minuteMs)
    return `${minutes} phút trước`
  }

  if (diffMs >= hourMs && diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    return `${hours} giờ trước`
  }

  if (diffMs >= dayMs && diffMs < 2 * dayMs) {
    return "Hôm qua"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(value)
}

export function generateSlug(title: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return githubSlug(normalized)
}

interface SlugLookupClient {
  post: Pick<PrismaClient["post"], "findUnique">
}

export async function ensureUniqueSlug(
  baseSlug: string,
  prisma: SlugLookupClient,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}
