import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.comment.updateMany({
      where: {
        post: {
          authorId: session.user.id,
        },
        authorEmail: {
          not: session.user.email,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[POST /api/user/mark-comments-read]", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
