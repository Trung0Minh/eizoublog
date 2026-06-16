import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const count = await prisma.comment.count({
      where: {
        post: {
          authorId: session.user.id,
        },
        authorEmail: {
          not: session.user.email,
        },
        isRead: false,
      },
    })

    return Response.json({ count })
  } catch (error) {
    console.error("[GET /api/user/unread-comments-count]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
