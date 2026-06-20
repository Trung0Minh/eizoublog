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
  const monthMs = 30 * dayMs
  const yearMs = 365 * dayMs

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

  if (diffMs >= dayMs && diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs)
    return `${days} ngày trước`
  }

  if (diffMs >= monthMs && diffMs < yearMs) {
    const months = Math.floor(diffMs / monthMs)
    return `${months} tháng trước`
  }

  if (diffMs >= yearMs) {
    const years = Math.floor(diffMs / yearMs)
    return `${years} năm trước`
  }

  return formatExactDateTime(value)
}

export function formatExactDateTime(date: Date | string): string {
  const value = new Date(date)
  const pad = (number: number) => String(number).padStart(2, "0")

  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`
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
