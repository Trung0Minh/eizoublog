import { z } from "zod"

export const DEFAULT_DISPLAY_ROLE_NAME = "Writer"
export const DEFAULT_DISPLAY_ROLE_COLOR = "#0D9488"

const RESERVED_ROLE_NAMES = [
  "admin",
  "administrator",
  "moderator",
  "mod",
  "official",
  "owner",
  "staff",
  "chusohuu",
  "chinhthuc",
  "nhanvien",
  "quantrivien",
] as const

function normalizeRoleName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function normalizeForReservedCheck(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const roleNameSchema = z
  .string()
  .transform(normalizeRoleName)
  .pipe(
    z
      .string()
      .min(2, "Role name must be at least 2 characters")
      .max(24, "Role name must be at most 24 characters")
      .regex(
        /^[\p{L}\p{N}](?:[\p{L}\p{N} .&'-]*[\p{L}\p{N}])?$/u,
        "Role name contains unsupported characters",
      ),
  )
  .refine(
    (value) => {
      const normalized = normalizeForReservedCheck(value)
      const compact = normalized.replace(/ /g, "")
      return !RESERVED_ROLE_NAMES.some((reserved) => {
        if (reserved === "mod") {
          return normalized.split(" ").includes(reserved)
        }

        return compact.includes(reserved)
      })
    },
    { message: "Role name is reserved" },
  )

const roleColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Role color must be a six-digit hex color")
  .transform((value) => value.toUpperCase())

export const displayRoleSchema = z.object({
  displayRoleColor: roleColorSchema,
  displayRoleName: roleNameSchema,
})

type Rgb = [number, number, number]

function hexToRgb(color: string): Rgb {
  return [1, 3, 5].map((offset) =>
    Number.parseInt(color.slice(offset, offset + 2), 16),
  ) as Rgb
}

function rgbToHex([red, green, blue]: Rgb) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase()
}

function blendRgb(foreground: Rgb, background: Rgb, amount: number): Rgb {
  return foreground.map((channel, index) =>
    Math.round(channel * (1 - amount) + background[index] * amount),
  ) as Rgb
}

function relativeLuminance(color: string | Rgb) {
  const channels = (typeof color === "string" ? hexToRgb(color) : color).map(
    (channel) => channel / 255,
  )
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  )

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first: number, second: number) {
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getDisplayRoleForeground(color: string) {
  const background = relativeLuminance(color)
  const dark = relativeLuminance("#18181B")
  const light = relativeLuminance("#FFFFFF")

  return contrastRatio(background, dark) >= contrastRatio(background, light)
    ? "#18181B"
    : "#FFFFFF"
}

function adjustForContrast(color: Rgb, background: Rgb, target: Rgb) {
  for (let step = 0; step <= 100; step += 1) {
    const candidate = blendRgb(color, target, step / 100)
    if (
      contrastRatio(
        relativeLuminance(candidate),
        relativeLuminance(background),
      ) >= 4.5
    ) {
      return rgbToHex(candidate)
    }
  }

  return rgbToHex(target)
}

export function getDisplayRolePalette(color: string) {
  const selected = hexToRgb(color)
  const lightSurface: Rgb = [255, 255, 255]
  const darkSurface: Rgb = [24, 24, 27]
  const lightBackground = blendRgb(selected, lightSurface, 0.84)
  const darkBackground = blendRgb(selected, darkSurface, 0.8)

  return {
    darkBackground: `${color}33`,
    darkForeground: adjustForContrast(selected, darkBackground, lightSurface),
    lightBackground: `${color}29`,
    lightForeground: adjustForContrast(selected, lightBackground, [0, 0, 0]),
  }
}
