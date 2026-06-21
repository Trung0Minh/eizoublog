import { z, ZodError } from "zod"

import { getCachedSearchResults } from "@/lib/queries"
import { buildSearchQuery, type SearchResult } from "@/lib/search"

const searchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().max(200).optional().default(""),
  category: z.string().optional(),
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
    const { limit, page, q, category, tag } = searchSchema.parse(
      Object.fromEntries(searchParams),
    )
    const query = q.trim()
    const tsQuery = buildSearchQuery(query)

    if (!query || !tsQuery) {
      return Response.json({ data: emptySearchPayload(page, limit) })
    }

    const { results, total } = await getCachedSearchResults(
      tsQuery,
      page,
      limit,
      category,
      tag,
    )

    return Response.json({
      data: {
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit),
        },
        query,
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
