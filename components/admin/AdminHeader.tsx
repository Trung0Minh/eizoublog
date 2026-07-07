"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { WriterMenu } from "@/components/layout/WriterMenu"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  FolderTree,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Trophy,
  Users,
  Settings,
} from "lucide-react"

const ADMIN_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/content", icon: FolderTree, label: "Content" },
  { href: "/admin/events", icon: Trophy, label: "Events" },
  { href: "/admin/writers", icon: Users, label: "Writers" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings/backgrounds", icon: Settings, label: "Settings" },
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
          
          <button
            aria-label="Open admin menu"
            className="p-1.5 text-text-secondary transition-colors hover:text-text-primary xl:hidden rounded-full hover:bg-subtle-bg"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="hidden items-center md:flex gap-1">
            <SeasonToggle />
            <ParticleToggle />
            <ThemeToggle />
          </div>
          <div className="h-4 w-px bg-border-default/50 mx-2 hidden md:block" />
          <WriterMenu user={user} />
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <button
            aria-label="Close admin menu"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <div className="absolute bottom-0 left-0 top-0 flex w-[280px] flex-col border-r border-border-default/60 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default/40 p-5 h-[72px]">
              <span className="text-[16px] font-bold text-text-primary">Admin Panel</span>
              <button
                className="p-2 rounded-md text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-4 py-6 overflow-y-auto">
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
            <div className="border-t border-border-default/40 p-4">
              <Link
                className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-subtle-bg text-[14px] font-medium text-text-primary transition-colors hover:bg-border-default/50"
                href="/"
                prefetch={false}
              >
                View blog &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
