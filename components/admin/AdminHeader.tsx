"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { WriterMenu } from "@/components/layout/WriterMenu"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  FolderTree,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Trophy,
  Users,
  ImageIcon,
} from "lucide-react"

const ADMIN_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/content", icon: FolderTree, label: "Content" },
  { href: "/admin/events", icon: Trophy, label: "Events" },
  { href: "/admin/writers", icon: Users, label: "Writers" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
  { href: "/admin/settings/backgrounds", icon: ImageIcon, label: "Backgrounds" },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminHeader({ user }: { user?: WriterMenuUser | null }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="xl:hidden z-40 p-4 md:p-6 lg:p-8 flex justify-end pointer-events-none">
        <div className="flex items-center gap-2 rounded-full border border-border-default/50 bg-background/50 backdrop-blur-3xl px-3 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] pointer-events-auto">
          
          <DropdownMenu open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open admin menu"
                className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary xl:hidden"
                type="button"
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="z-50 w-[min(240px,calc(100vw-2rem))] rounded-[18px] border-border-default/70 bg-background p-2 shadow-xl xl:hidden"
              sideOffset={8}
            >
              <nav aria-label="Mobile admin navigation" className="flex max-h-[min(60vh,420px)] flex-col gap-1 overflow-y-auto">
                {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
                  const active = isActivePath(pathname, href)

                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-all",
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                      )}
                      href={href}
                      key={href}
                      onClick={() => setDrawerOpen(false)}
                      prefetch={false}
                    >
                      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                      {label}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-2 border-t border-border-default/40 pt-2">
                <Link
                  className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-subtle-bg text-[14px] font-medium text-text-primary transition-colors hover:bg-border-default/50"
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  prefetch={false}
                >
                  View blog &rarr;
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-0.5" data-testid="mobile-admin-appearance-controls">
            <SeasonToggle />
            <ParticleToggle />
            <ThemeToggle />
          </div>
          <div className="mx-1 h-4 w-px bg-border-default/50" />
          <WriterMenu user={user} />
        </div>
      </header>

    </>
  )
}
