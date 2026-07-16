import { revalidateTag } from "next/cache"
import { ZodError } from "zod"

import { displayRoleSchema } from "@/lib/displayRole"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const activeSession = await getActiveSession(["WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = displayRoleSchema.parse(await request.json())
    const currentUser = await prisma.user.findUnique({
      select: { displayRoleLocked: true },
      where: { id: activeSession.user.id },
    })

    if (!currentUser) {
      return Response.json({ error: "Writer not found" }, { status: 404 })
    }

    if (currentUser.displayRoleLocked) {
      return Response.json(
        { error: "Your display role is locked by an admin" },
        { status: 403 },
      )
    }

    const updateResult = await prisma.user.updateMany({
      data,
      where: {
        displayRoleLocked: false,
        id: activeSession.user.id,
        role: "WRITER",
      },
    })

    if (updateResult.count === 0) {
      return Response.json(
        { error: "Your display role is locked by an admin" },
        { status: 403 },
      )
    }

    const user = await prisma.user.findUnique({
      select: {
        displayRoleColor: true,
        displayRoleLocked: true,
        displayRoleName: true,
        id: true,
      },
      where: { id: activeSession.user.id },
    })

    revalidateTag("users", "max")
    revalidateTag("posts", "max")
    revalidateTag("comments", "max")

    return Response.json({ data: user })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid display role" }, { status: 400 })
    }

    console.error("[PATCH /api/profile/display-role]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
