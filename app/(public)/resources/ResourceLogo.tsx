import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function isAvatarLogo(logoPath: string) {
  const avatarLogos = [
    "magicalstage",
    "ultimatemegax",
    "artistunknown",
    "sarca",
    "rcanime",
    "lkr",
    "uts",
    "canipa",
    "hiphopsakuga",
    "hobbessakuga"
  ]
  return avatarLogos.some(name => logoPath.toLowerCase().includes(name))
}

const optimizedLogoSources: Record<string, string> = {
  "/logos/fullfrontal.png": "/logos/fullfrontal.webp",
  "/logos/ultimatemegax.png": "/logos/ultimatemegax.webp",
}

export function ResourceLogo({ logo, alt, fallback = null, iconClassName }: {
  logo: string
  alt: string
  fallback?: ReactNode
  iconClassName?: string
}) {
  if (logo === "X") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-full w-full fill-current", iconClassName)}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
      </svg>
    )
  }
  if (!logo) return fallback
  return (
    <img
      src={optimizedLogoSources[logo] ?? logo}
      alt={alt}
      className={cn("h-full w-full", isAvatarLogo(logo) ? "object-cover" : "object-contain")}
    />
  )
}
