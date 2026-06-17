"use client"

import { useEffect, useState } from "react"
import type { Role } from "@prisma/client"

export interface ClientSessionUser {
  avatarUrl: string | null
  name: string
  role?: Role
  username: string
}

type SessionStatus = "authenticated" | "guest" | "loading"

let sessionUserPromise: Promise<ClientSessionUser | null> | null = null
let sessionUserValue: ClientSessionUser | null | undefined

function getSessionRole(value: unknown): Role | undefined {
  return value === "ADMIN" || value === "WRITER" || value === "REVOKED"
    ? value
    : undefined
}

export function getSessionUser(value: unknown): ClientSessionUser | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof value.user === "object" &&
    value.user !== null &&
    "name" in value.user &&
    "username" in value.user &&
    typeof value.user.name === "string" &&
    typeof value.user.username === "string"
  ) {
    return {
      avatarUrl:
        "avatarUrl" in value.user && typeof value.user.avatarUrl === "string"
          ? value.user.avatarUrl
          : null,
      name: value.user.name,
      role: "role" in value.user ? getSessionRole(value.user.role) : undefined,
      username: value.user.username,
    }
  }

  return null
}

export function clearSessionUserCache() {
  sessionUserPromise = null
  sessionUserValue = undefined
}

export async function loadSessionUser() {
  if (sessionUserValue !== undefined) {
    return sessionUserValue
  }

  sessionUserPromise ??= fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        return null
      }

      return getSessionUser(await response.json())
    })
    .catch(() => null)
    .then((user) => {
      sessionUserValue = user
      return user
    })

  return sessionUserPromise
}

export function useSessionUser() {
  const [state, setState] = useState<{
    status: SessionStatus
    user: ClientSessionUser | null
  }>(() =>
    sessionUserValue === undefined
      ? { status: "loading", user: null }
      : {
          status: sessionUserValue ? "authenticated" : "guest",
          user: sessionUserValue,
        },
  )

  useEffect(() => {
    let isMounted = true

    void loadSessionUser().then((user) => {
      if (!isMounted) return

      setState({
        status: user ? "authenticated" : "guest",
        user,
      })
    })

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
