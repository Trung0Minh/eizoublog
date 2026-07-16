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

function relativeLuminance(color: string) {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(color.slice(offset, offset + 2), 16) / 255,
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

// Tinted badges need a dark label for very light custom colors; using the raw
// color there would make the text disappear against its pale background.
export function getDisplayRoleTextColor(color: string) {
  return relativeLuminance(color) > 0.55 ? "#18181B" : color
}
