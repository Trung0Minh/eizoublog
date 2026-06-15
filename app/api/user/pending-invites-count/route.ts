import { getActiveSession } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return Response.json({ count: 0 }, { status: 200 })
  }

  try {
    const count = await prisma.postAuthor.count({
      where: {
        userId: activeSession.user.id,
        status: "PENDING",
        post: { status: { not: "ARCHIVED" } },
      },
    })

    return Response.json({ count }, { status: 200 })
  } catch (error) {
    console.error("[GET /api/user/pending-invites-count]", error)
    return Response.json({ count: 0 }, { status: 200 })
  }
}
