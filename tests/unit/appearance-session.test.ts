import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getAutomaticSeason,
  getAppearanceInitScript,
  getVietnamIsDark,
  initializeAppearance,
  setSessionSeason,
  setSessionTheme,
} from "@/lib/appearanceSession"

function clearCookies() {
  document.cookie.split(";").forEach((entry) => {
    const name = entry.split("=")[0]?.trim()
    if (name) {
      document.cookie = `${name}=; Max-Age=0; Path=/`
    }
  })
}

afterEach(() => {
  clearCookies()
  localStorage.clear()
  document.documentElement.removeAttribute("data-season")
  vi.unstubAllGlobals()
})

describe("Vietnam automatic appearance", () => {
  it("uses dark mode at 19:15 Vietnam time", () => {
    expect(getVietnamIsDark(new Date("2026-06-25T12:15:00.000Z"))).toBe(true)
  })

  it("uses the Vietnam calendar month for the automatic season", () => {
    expect(getAutomaticSeason(new Date("2026-05-31T18:00:00.000Z"))).toBe(
      "summer",
    )
  })
})

describe("session appearance overrides", () => {
  it("writes manual choices as session cookies", () => {
    setSessionTheme("dark")
    setSessionSeason("autumn")

    expect(document.cookie).toContain("appearanceTheme=dark")
    expect(document.cookie).toContain("appearanceSeason=autumn")
  })

  it("clears a stale persistent theme when a new session has no override", () => {
    localStorage.setItem("theme", "light")

    initializeAppearance(new Date("2026-06-25T12:15:00.000Z"))

    expect(localStorage.getItem("theme")).toBeNull()
    expect(window.matchMedia("(prefers-color-scheme: dark)").matches).toBe(true)
  })

  it("restores theme and season overrides during the active session", () => {
    setSessionTheme("light")
    setSessionSeason("autumn")

    initializeAppearance(new Date("2026-06-25T12:15:00.000Z"))

    expect(localStorage.getItem("theme")).toBe("light")
    expect(document.documentElement).toHaveAttribute("data-season", "autumn")
  })

  it("produces a self-contained startup script", () => {
    vi.useFakeTimers()
    localStorage.setItem("theme", "dark")

    Function(getAppearanceInitScript())()

    expect(localStorage.getItem("theme")).toBeNull()
    expect(document.documentElement).toHaveAttribute("data-season")
    vi.useRealTimers()
  })
})
