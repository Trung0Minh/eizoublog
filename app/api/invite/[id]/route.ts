import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    const existingInvite = await prisma.invite.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingInvite) {
      return Response.json({ error: "Invite not found" }, { status: 404 })
    }

    await prisma.invite.delete({
      where: { id },
    })

    revalidateTag("invites", "max")

    return Response.json({ data: { message: "Invite removed" } })
  } catch (error) {
    console.error("[DELETE /api/invite/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
