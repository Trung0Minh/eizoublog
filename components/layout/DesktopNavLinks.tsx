"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"

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
                "relative flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-display font-bold tracking-wide transition-colors",
                isActive
                  ? "text-accent"
                  : "text-text-secondary hover:text-accent",
              )}
              href={link.href}
            >
              <span className="relative z-10">{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-nav-blob"
                  className="absolute inset-0 z-0 rounded-full bg-accent/15 shadow-[0_0_18px_var(--accent)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          </MagneticEffect>
        )
      })}
    </>
  )
}
