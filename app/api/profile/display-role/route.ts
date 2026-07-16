import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { displayRoleSchema } from "@/lib/displayRole"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const updateDisplayRoleSchema = z.union([
  displayRoleSchema,
  z.object({ displayRoleColor: z.null(), displayRoleName: z.null() }),
])

export async function PATCH(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const data = updateDisplayRoleSchema.parse(await request.json())
    const currentUser = await prisma.user.findUnique({
      select: { displayRoleLocked: true, role: true },
      where: { id: activeSession.user.id },
    })

    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    if (currentUser.role === "WRITER" && currentUser.displayRoleLocked) {
      return Response.json(
        { error: "Your display role is locked by an admin" },
        { status: 403 },
      )
    }

    if (currentUser.role === "WRITER" && data.displayRoleName === null) {
      return Response.json({ error: "Invalid display role" }, { status: 400 })
    }

    const updateResult = await prisma.user.updateMany({
      data,
      where:
        currentUser.role === "WRITER"
          ? {
              displayRoleLocked: false,
              id: activeSession.user.id,
              role: "WRITER",
            }
          : { id: activeSession.user.id, role: "ADMIN" },
    })

    if (updateResult.count === 0) {
      const message =
        currentUser.role === "WRITER"
          ? "Your display role is locked by an admin"
          : "Unable to update display role"
      return Response.json({ error: message }, { status: 403 })
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
