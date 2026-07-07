"use client"

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
  ArrowLeft,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { WriterMenu } from "@/components/layout/WriterMenu"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"

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

export function AdminSidebar({ user }: { user?: WriterMenuUser | null }) {
  const pathname = usePathname()

  return (
    <aside className="hidden xl:flex w-[260px] flex-col rounded-[32px] border border-border-default/50 bg-background/40 backdrop-blur-3xl shadow-lg h-full shrink-0 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex h-[88px] items-center px-8 border-b border-border-default/30">
        <span className="text-[18px] font-bold tracking-tight text-text-primary">
          Admin Workspace
        </span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto py-6 px-5 flex flex-col gap-2 scrollbar-none">
        <Link
          className="mb-4 flex h-10 items-center gap-3 rounded-[16px] px-3 text-[14px] font-medium text-text-secondary transition-all hover:bg-subtle-bg/80 hover:text-text-primary group"
          href="/"
          prefetch={false}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border-default/50 shadow-sm text-text-tertiary group-hover:text-text-primary transition-colors">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </div>
          Return to Blog
        </Link>
        
        {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
          const active = isActivePath(pathname, href)

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-[44px] items-center gap-3 rounded-[14px] px-3 text-[14px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent/10 text-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-accent/10"
                  : "text-text-secondary hover:bg-subtle-bg/60 hover:text-text-primary border border-transparent hover:border-border-default/30"
              )}
              href={href}
              key={href}
              prefetch={false}
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors shadow-sm border",
                active ? "text-accent bg-background border-accent/20" : "text-text-tertiary bg-transparent border-transparent group-hover:bg-background group-hover:border-border-default/40 group-hover:text-text-primary group-hover:shadow-sm"
              )}>
                <Icon aria-hidden="true" className="h-[16px] w-[16px]" />
              </div>
              {label}
            </Link>
          )
        })}
      </div>

      <div className="relative z-10 p-5 mt-auto border-t border-border-default/30 bg-background/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <SeasonToggle />
            <ParticleToggle />
            <ThemeToggle />
          </div>
          <div className="h-4 w-px bg-border-default/50 mx-1" />
          <WriterMenu user={user} />
        </div>
      </div>
    </aside>
  )
}
