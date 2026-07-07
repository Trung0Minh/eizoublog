"use client"

import {
  ArrowLeft,
  BarChart3,
  FolderTree,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Trophy,
  Users,
  Settings,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { WriterMenu } from "@/components/layout/WriterMenu"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"

import { cn } from "@/lib/utils"

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

export function AdminNav({ user }: { user?: WriterMenuUser | null }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-default/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto grid h-[56px] w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-default/60 bg-background/45 px-3 text-[13px] font-medium text-text-secondary shadow-sm backdrop-blur-md transition-colors hover:border-accent/35 hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/"
            prefetch={false}
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Blog
          </Link>
          <span className="hidden text-[13px] font-semibold text-text-primary sm:inline">
            Admin
          </span>
        </div>

        <nav
          aria-label="Admin navigation"
          className="hidden min-w-0 items-center justify-center gap-1 xl:flex"
        >
          {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg/45 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active &&
                    "font-semibold text-accent hover:text-accent",
                )}
                href={href}
                key={href}
                prefetch={false}
                style={
                  active
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--accent) 13%, transparent)",
                        boxShadow:
                          "0 8px 22px color-mix(in srgb, var(--accent) 10%, transparent)",
                      }
                    : undefined
                }
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <div className="hidden items-center xl:flex">
            <SeasonToggle />
            <ParticleToggle />
            <ThemeToggle />
          </div>
          <div className="ml-1 hidden xl:block">
            <WriterMenu user={user} />
          </div>

          <button
            aria-label="Open admin menu"
            className="p-1.5 text-text-secondary transition-colors hover:text-text-primary xl:hidden"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <button
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <div className="absolute bottom-0 right-0 top-0 flex w-[280px] flex-col border-l border-border-default bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default p-5">
              <span className="text-[16px] font-bold">Admin Panel</span>
              <button
                className="p-1 text-text-secondary transition-colors hover:text-text-primary"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
                const active = isActivePath(pathname, href)

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg/50 hover:text-text-primary",
                      active && "bg-subtle-bg font-semibold text-text-primary",
                    )}
                    href={href}
                    key={href}
                    onClick={() => setDrawerOpen(false)}
                    prefetch={false}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border-default p-4">
              <Link
                className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                href="/"
                prefetch={false}
              >
                View blog &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
