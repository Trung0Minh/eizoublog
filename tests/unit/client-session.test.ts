import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

import {
  clearSessionUserCache,
  loadSessionUser,
  useAdminAccess,
} from "@/lib/clientSession"

describe("client session cache", () => {
  beforeEach(() => {
    clearSessionUserCache()
    vi.unstubAllGlobals()
  })

  it("deduplicates concurrent and repeated session loads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            avatarUrl: null,
            name: "Mina Writer",
            role: "WRITER",
            username: "mina",
          },
        }),
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const [first, second] = await Promise.all([
      loadSessionUser(),
      loadSessionUser(),
    ])
    const third = await loadSessionUser()

    expect(first).toEqual({
      avatarUrl: null,
      name: "Mina Writer",
      role: "WRITER",
      username: "mina",
    })
    expect(second).toEqual(first)
    expect(third).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    })
  })

  it("uses explicit admin access without fetching a session", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useAdminAccess(true))

    expect(result.current).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("resolves admin access through the shared client session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              avatarUrl: null,
              name: "Mina Admin",
              role: "ADMIN",
              username: "mina",
            },
          }),
        ),
      ),
    )

    const { result } = renderHook(() => useAdminAccess())

    await waitFor(() => expect(result.current).toBe(true))
  })
})
