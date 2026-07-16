import { describe, expect, it } from "vitest"

import {
  getCoverObjectPositionStyle,
  getCoverStyle,
} from "@/lib/cover-style"

describe("getCoverStyle", () => {
  const croppedUrl =
    "https://cdn.example.com/background.jpg?cx=10&cy=20&cw=60&ch=70&mcx=30&mcy=5&mcw=40&mch=90"

  it("uses mobile crop coordinates when requested", () => {
    expect(getCoverStyle(croppedUrl, "mobile")).toMatchObject({
      height: `${(100 / 90) * 100}%`,
      transform: "translate(-30%, -5%)",
      width: "250%",
    })
  })

  it("falls back to the desktop crop when mobile coordinates are absent", () => {
    const desktopOnly =
      "https://cdn.example.com/background.jpg?cx=10&cy=20&cw=60&ch=70"

    expect(getCoverStyle(desktopOnly, "mobile")).toEqual(
      getCoverStyle(desktopOnly, "desktop"),
    )
  })

  it("maps a fixed-ratio crop to object position without transforms", () => {
    expect(getCoverObjectPositionStyle(croppedUrl)).toEqual({
      objectFit: "cover",
      objectPosition: "25% 66.6667%",
    })
  })

  it("keeps legacy crop metadata on the existing transform path", () => {
    const legacyUrl =
      "https://cdn.example.com/background.jpg?zoom=1.2&tx=4&ty=-3"

    expect(getCoverObjectPositionStyle(legacyUrl)).toEqual(
      getCoverStyle(legacyUrl),
    )
  })
})
