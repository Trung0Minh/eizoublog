"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MagneticEffect } from "@/components/ui/MagneticEffect"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
}

export function DesktopNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <>
      {links.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`)

        return (
          <MagneticEffect key={link.href}>
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-3 py-2 text-[14px] font-display font-bold tracking-wide transition-colors",
                isActive
                  ? "bg-accent/15 text-accent shadow-[0_0_18px_var(--accent)]"
                  : "text-text-secondary hover:bg-accent/10 hover:text-accent",
              )}
              href={link.href}
            >
              {link.label}
              {isActive && (
                <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-accent" />
              )}
            </Link>
          </MagneticEffect>
        )
      })}
    </>
  )
}
