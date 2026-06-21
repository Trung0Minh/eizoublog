import { getCachedCommandCategories } from "@/lib/queries"

export async function GET() {
  try {
    const categories = await getCachedCommandCategories()

    return Response.json({ data: categories })
  } catch (error) {
    console.error("[GET /api/categories]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
