import { describe, expect, it } from "vitest"

import {
  DEFAULT_DISPLAY_ROLE_COLOR,
  DEFAULT_DISPLAY_ROLE_NAME,
  displayRoleSchema,
  getDisplayRoleForeground,
} from "@/lib/displayRole"

describe("display roles", () => {
  it("normalizes valid writer-controlled role values", () => {
    expect(
      displayRoleSchema.parse({
        displayRoleColor: "#c2410c",
        displayRoleName: "  Seasonal   Analyst  ",
      }),
    ).toEqual({
      displayRoleColor: "#C2410C",
      displayRoleName: "Seasonal Analyst",
    })
  })

  it.each([
    "Admin",
    "site administrator",
    "Official Writer",
    "Moderator",
    "Quản trị viên",
    "Owner",
  ])("rejects reserved or misleading role name %s", (displayRoleName) => {
    expect(() =>
      displayRoleSchema.parse({
        displayRoleColor: "#0D9488",
        displayRoleName,
      }),
    ).toThrow()
  })

  it("rejects markup, emoji-only names, and non-hex colors", () => {
    expect(() =>
      displayRoleSchema.parse({
        displayRoleColor: "red",
        displayRoleName: "<b>Critic</b>",
      }),
    ).toThrow()
    expect(() =>
      displayRoleSchema.parse({
        displayRoleColor: "#12345G",
        displayRoleName: "🎨🎨",
      }),
    ).toThrow()
  })

  it("allows legitimate editorial titles containing the letters in mod", () => {
    expect(
      displayRoleSchema.parse({
        displayRoleColor: "#0D9488",
        displayRoleName: "Model Animator",
      }).displayRoleName,
    ).toBe("Model Animator")
  })

  it("provides a stable default role for new writers", () => {
    expect(DEFAULT_DISPLAY_ROLE_NAME).toBe("Writer")
    expect(DEFAULT_DISPLAY_ROLE_COLOR).toMatch(/^#[0-9A-F]{6}$/)
  })

  it("chooses readable text for light and dark badge colors", () => {
    expect(getDisplayRoleForeground("#F4F4F5")).toBe("#18181B")
    expect(getDisplayRoleForeground("#18181B")).toBe("#FFFFFF")
  })
})
