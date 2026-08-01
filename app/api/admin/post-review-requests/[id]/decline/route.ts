import { Prisma } from "@prisma/client"
import { ZodError, z } from "zod"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { declinePostReviewRequest } from "@/lib/postReviewRequests"

const declineSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const input = declineSchema.parse(await request.json())
    await declinePostReviewRequest(id, activeSession.user, input.reason)

    return Response.json({ data: { status: "DECLINED" } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { error: "Review request is not pending" },
        { status: 409 },
      )
    }

    console.error("[POST /api/admin/post-review-requests/[id]/decline]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
