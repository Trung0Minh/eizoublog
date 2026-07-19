import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterNavControls } from "@/components/layout/WriterNavControls"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { MagneticEffect } from "@/components/ui/MagneticEffect"
import { CommandMenuTrigger } from "@/components/ui/CommandMenuTrigger"
import { MobileSettings } from "@/components/layout/MobileSettings"
import { DesktopNavLinks } from "@/components/layout/DesktopNavLinks"

const NAV_LINKS = [
  { href: "/nhap-mon-sakuga", label: "Nhập môn Sakuga" },
  { href: "/contributors", label: "Đóng góp" },
  { href: "/resources", label: "Nguồn tham khảo" },
  { href: "/about", label: "Giới thiệu" },
]

export function Navbar({ user }: { user?: WriterMenuUser | null }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent py-2 transition-all duration-300 md:py-4">
      <div className="glass-navbar mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-4 md:h-14 md:gap-4 md:px-6 lg:px-8">
        <Link
          aria-label={appName}
          className="group flex shrink-0 items-center"
          href="/"
        >
          <span
            aria-hidden="true"
            className="block aspect-[3480.342/402] w-[102px] bg-accent transition-opacity duration-200 group-hover:opacity-75 sm:w-[128px] lg:w-[146px]"
            data-testid="site-wordmark"
            style={{
              maskImage: "url('/eizoublog-logo.svg')",
              maskPosition: "center",
              maskRepeat: "no-repeat",
              maskSize: "contain",
              WebkitMaskImage: "url('/eizoublog-logo.svg')",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
            }}
          />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex"
        >
          <DesktopNavLinks links={NAV_LINKS} />
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="block">
            <CommandMenuTrigger />
          </div>
          <div className="hidden md:flex items-center gap-1">
            <MagneticEffect>
              <a
                href="https://discord.gg/wgCr86Cdb"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-subtle-bg hover:text-accent transition-colors"
                title="Tham gia Discord"
              >
                <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-5 h-5">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C3.12,31.78-1.2,54.85,.3,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3A75.7,75.7,0,0,0,96,78.23c.93,.8,1.93,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.71-18.83C128.7,54.85,124.3,31.78,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                </svg>
              </a>
            </MagneticEffect>
            <SeasonToggle />
            <ParticleToggle />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <MobileSettings />
          <WriterNavControls links={NAV_LINKS} user={user} />
        </div>
      </div>
    </header>
  )
}
