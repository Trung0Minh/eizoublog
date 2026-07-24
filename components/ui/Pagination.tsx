import Link from "next/link"

import { cn } from "@/lib/utils"
import { MagneticEffect } from "@/components/ui/MagneticEffect"

interface PaginationProps {
  className?: string
  page: number
  pageSize: number
  prefetch?: boolean
  query?: Record<string, number | string | string[] | undefined>
  total: number
}

const paginationLinkClass =
  "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"

function getPageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  )
}

function buildPageHref(
  page: number,
  query?: Record<string, number | string | string[] | undefined>,
) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item.trim()) {
          searchParams.append(key, item)
        }
      }
    } else if (value !== undefined && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  }

  searchParams.set("page", String(page))
  return `?${searchParams.toString()}`
}

export function Pagination({
  className,
  page,
  pageSize,
  prefetch,
  query,
  total,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) {
    return null
  }

  const pages = getPageWindow(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2 mt-8 md:mt-12", className)}
    >
      {page > 1 && (
        <MagneticEffect>
          <Link
            className={cn(paginationLinkClass, "w-auto px-4")}
            href={buildPageHref(page - 1, query)}
            prefetch={prefetch}
          >
            Trang trước
          </Link>
        </MagneticEffect>
      )}

      {pages.map((pageNumber) => (
        <MagneticEffect key={pageNumber}>
          <Link
            aria-current={pageNumber === page ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
            className={cn(
              paginationLinkClass,
              pageNumber === page &&
                "bg-text-primary text-background hover:bg-text-primary hover:text-background",
            )}
            href={buildPageHref(pageNumber, query)}
            prefetch={prefetch}
          >
            {pageNumber}
          </Link>
        </MagneticEffect>
      ))}

      {page < totalPages && (
        <MagneticEffect>
          <Link
            className={cn(paginationLinkClass, "w-auto px-4")}
            href={buildPageHref(page + 1, query)}
            prefetch={prefetch}
          >
            Trang sau
          </Link>
        </MagneticEffect>
      )}
    </nav>
  )
}
