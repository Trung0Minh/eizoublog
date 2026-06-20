import Link from "next/link"
import { Sparkles, Search } from "lucide-react"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterNavControls } from "@/components/layout/WriterNavControls"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { MagneticEffect } from "@/components/ui/MagneticEffect"

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
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
              className="group flex h-9 w-full items-center gap-2 rounded-full border border-border-default bg-subtle-bg px-3 text-sm text-text-tertiary transition-colors hover:border-accent hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Tìm kiếm...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border-default bg-background px-1.5 font-mono text-[10px] font-medium text-text-tertiary opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
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
