import { getActiveSession, unauthorizedResponse } from "@/lib/authz"

async function deprecatedArchiveResponse() {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  return Response.json(
    { error: "A moderation reason is required. Use the admin moderation endpoint." },
    { status: 410 },
  )
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  void request
  void context
  return deprecatedArchiveResponse()
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  void request
  void context
  return deprecatedArchiveResponse()
}
