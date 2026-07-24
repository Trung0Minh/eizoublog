import { z, ZodError } from "zod"

import { getCachedSearchResults } from "@/lib/queries"
import {
  prepareSearchQuery,
  type SearchFilters,
  type SearchResult,
} from "@/lib/search"

const searchSchema = z.object({
  archive: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().max(200).optional().default(""),
  tag: z.string().optional(),
})

function emptySearchPayload(page = 1, limit = 10) {
  return {
    pagination: { limit, page, total: 0, totalPages: 0 },
    query: "",
    results: [] as SearchResult[],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { archive, limit, page, q, category, tag } = searchSchema.parse(
      Object.fromEntries(searchParams),
    )
    const searchQuery = prepareSearchQuery(q)
    const tagSlugs = Array.from(
      new Set([...searchParams.getAll("tags"), ...(tag ? [tag] : [])]),
    ).filter(Boolean)
    const filters: SearchFilters = {
      archive,
      categorySlug: category,
      tagSlugs,
    }
    const hasFilters = Boolean(category || archive || tagSlugs.length > 0)

    if (!searchQuery.normalizedQuery && !hasFilters) {
      return Response.json({ data: emptySearchPayload(page, limit) })
    }

    const { results, total } = await getCachedSearchResults(
      searchQuery,
      page,
      limit,
      filters,
    )

    return Response.json({
      data: {
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit),
        },
        query: searchQuery.displayQuery,
        results,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ data: emptySearchPayload() })
    }

    console.error("[GET /api/search]", error)
    return Response.json({ error: "Search failed" }, { status: 500 })
  }
}
