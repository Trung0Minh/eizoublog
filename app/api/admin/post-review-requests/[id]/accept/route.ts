import { Prisma } from "@prisma/client"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import {
  acceptPostReviewRequest,
  PostReviewRequestError,
} from "@/lib/postReviewRequests"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    await acceptPostReviewRequest(id, activeSession.user)

    return Response.json({ data: { status: "ACCEPTED" } })
  } catch (error) {
    if (error instanceof PostReviewRequestError) {
      return Response.json({ error: error.message }, { status: error.status })
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

    if (error instanceof Error && error.message === "Review request is not pending") {
      return Response.json({ error: error.message }, { status: 409 })
    }

    console.error("[POST /api/admin/post-review-requests/[id]/accept]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
