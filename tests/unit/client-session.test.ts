import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearSessionUserCache,
  loadSessionUser,
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
})
