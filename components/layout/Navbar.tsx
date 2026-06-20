import Link from "next/link"
import { Sparkles, Search } from "lucide-react"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterNavControls } from "@/components/layout/WriterNavControls"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { MagneticEffect } from "@/components/ui/MagneticEffect"
import { CommandMenuTrigger } from "@/components/ui/CommandMenuTrigger"

const NAV_LINKS = [
  { href: "/contributors", label: "Đóng góp" },
  { href: "/resources", label: "Nguồn tham khảo" },
  { href: "/about", label: "Giới thiệu" },
]

export function Navbar({ user }: { user?: WriterMenuUser | null }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-14 w-full shadow-sm">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <Link
          className="font-bold text-[18px] text-accent flex items-center gap-2 tracking-tight group shrink-0"
          href="/"
        >
          <MagneticEffect strength={0.4}>
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-accent block" />
          </MagneticEffect>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500 drop-shadow-sm">
            {appName}
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <MagneticEffect key={link.href}>
              <Link
                className="flex items-center gap-2 text-[14px] font-display font-bold tracking-wide text-text-secondary hover:text-accent transition-colors"
                href={link.href}
              >
                {link.label}
              </Link>
            </MagneticEffect>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden w-[280px] md:block">
            <CommandMenuTrigger />
          </div>
          <div className="flex items-center">
            <SeasonToggle />
            <ParticleToggle />
            <ThemeToggle />
          </div>
          <WriterNavControls links={NAV_LINKS} user={user} />
        </div>
      </div>
    </header>
  )
}
