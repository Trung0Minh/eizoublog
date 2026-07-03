import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Role } from "@prisma/client"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import {
  getAuthSecret,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from "@/lib/authConstants"
import { verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"

function getRole(value: unknown): Role | null {
  return value === "ADMIN" || value === "WRITER" || value === "REVOKED"
    ? value
    : null
}

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: parsedCredentials.data.email },
          select: {
            avatarUrl: true,
            email: true,
            id: true,
            name: true,
            passwordHash: true,
            role: true,
            username: true,
          },
        })

        if (!user || user.role === "REVOKED" || !user.passwordHash) {
          return null
        }

        const passwordIsValid = await verifyPassword(
          parsedCredentials.data.password,
          user.passwordHash
        )

        if (!passwordIsValid) {
          return null
        }

        return {
          avatarUrl: user.avatarUrl,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
        }
      },
    }),
  ],
  session: {
    maxAge: SESSION_MAX_AGE_SECONDS,
    strategy: "jwt",
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, role: true },
      })

      return Boolean(existingUser && existingUser.role !== "REVOKED")
    },
    async jwt({ token, user }) {
      const userId =
        (typeof token.sub === "string" ? token.sub : null) ||
        (user?.id && typeof user.id === "string" ? user.id : null)

      if (!userId) {
        return token
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          avatarUrl: true,
          email: true,
          id: true,
          name: true,
          role: true,
          username: true,
        },
      })

      if (dbUser) {
        token.sub = dbUser.id
        token.email = dbUser.email
        token.name = dbUser.name
        token.role = dbUser.role
        token.username = dbUser.username
        token.avatarUrl = dbUser.avatarUrl
      }

      return token
    },
    async session({ session, token }) {
      if (typeof token.sub === "string") {
        session.user.id = token.sub
      }

      const role = getRole(token.role)

      if (role) {
        session.user.role = role
      }

      if (typeof token.username === "string") {
        session.user.username = token.username
      }

      if (typeof token.name === "string") {
        session.user.name = token.name
      }

      if (typeof token.email === "string") {
        session.user.email = token.email
      }

      session.user.avatarUrl =
        typeof token.avatarUrl === "string" ? token.avatarUrl : null

      return session
    },
  },
})
