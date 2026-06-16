"use client"

import {
  BarChart3,
  FolderTree,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { WriterMenu } from "@/components/layout/WriterMenu"

import { cn } from "@/lib/utils"

const ADMIN_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/content", icon: FolderTree, label: "Content" },
  { href: "/admin/writers", icon: Users, label: "Writers" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 h-[56px] w-full border-b border-border-default bg-background">
      <div className="relative mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 md:px-6">
        <div className="flex items-center">
          <Link
            className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-text-secondary"
            href="/"
            prefetch={false}
          >
            &larr; Blog
          </Link>
          <div className="mx-3 h-4 w-px bg-border-default md:mx-4" />
          <span className="text-[13px] font-semibold text-text-primary">
            Admin
          </span>
        </div>

        <nav
          aria-label="Admin navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
        >
          {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-subtle-bg font-semibold text-text-primary",
                )}
                href={href}
                key={href}
                prefetch={false}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <WriterMenu />
          </div>

          <button
            aria-label="Open admin menu"
            className="p-1.5 text-text-secondary transition-colors hover:text-text-primary md:hidden"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
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
