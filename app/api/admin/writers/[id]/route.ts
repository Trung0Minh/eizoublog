import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { displayRoleSchema } from "@/lib/displayRole"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

const adminDisplayRoleSchema = z.union([
  displayRoleSchema.extend({ displayRoleLocked: z.boolean() }),
  z.object({
    displayRoleColor: z.null(),
    displayRoleLocked: z.boolean(),
    displayRoleName: z.null(),
  }),
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const data = adminDisplayRoleSchema.parse(await request.json())
    const writer = await prisma.user.findUnique({
      select: { id: true, role: true },
      where: { id },
    })

    if (!writer) {
      return Response.json({ error: "Writer not found" }, { status: 404 })
    }

    if (writer.role !== "WRITER") {
      return Response.json(
        { error: "Display roles can only be assigned to active writers" },
        { status: 400 },
      )
    }

    const updatedWriter = await prisma.user.update({
      data,
      select: {
        displayRoleColor: true,
        displayRoleLocked: true,
        displayRoleName: true,
        id: true,
      },
      where: { id },
    })

    revalidateTag("users", "max")
    revalidateTag("posts", "max")
    revalidateTag("comments", "max")

    return Response.json({ data: updatedWriter })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid display role" }, { status: 400 })
    }

    console.error("[PATCH /api/admin/writers/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}

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
    const writer = await prisma.user.findUnique({
      select: { id: true, role: true },
      where: { id },
    })

    if (!writer) {
      return Response.json({ error: "Writer not found" }, { status: 404 })
    }

    if (writer.role === "ADMIN") {
      return Response.json(
        { error: "Cannot remove admin accounts" },
        { status: 400 },
      )
    }

    const postCount = await prisma.post.count({ where: { authorId: id } })

    if (postCount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          data: { role: "REVOKED" },
          select: { id: true },
          where: { id },
        }),
        prisma.session.deleteMany({ where: { userId: id } }),
        prisma.account.deleteMany({ where: { userId: id } }),
      ])
    } else {
      await prisma.user.delete({
        select: { id: true },
        where: { id },
      })
    }

    revalidateTag("users", "max")

    return Response.json({ data: { message: "Writer access removed" } })
  } catch (error) {
    console.error("[DELETE /api/admin/writers/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
