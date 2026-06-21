import type { Role } from "@prisma/client"
import type { Session } from "next-auth"
import { unstable_cache } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface ActiveSessionUser {
  avatarUrl: string | null
  email: string
  id: string
  name: string
  role: Role
  username: string
}

export interface ActiveSession {
  session: Session
  user: ActiveSessionUser
}

export const getCachedActiveSessionUser = unstable_cache(
  async (userId: string) =>
    prisma.user.findUnique({
      select: {
        avatarUrl: true,
        email: true,
        id: true,
        name: true,
        role: true,
        username: true,
      },
      where: { id: userId },
    }),
  ["active-session-user"],
  { revalidate: 60, tags: ["users"] },
)

export async function getActiveSession(
  allowedRoles?: readonly Role[],
): Promise<ActiveSession | null> {
  const session = await auth()

  if (!session?.user.id) {
    return null
  }

  const user = await getCachedActiveSessionUser(session.user.id)

  if (!user || user.role === "REVOKED") {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return { session, user }
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}
