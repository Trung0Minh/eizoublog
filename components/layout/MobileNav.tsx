"use client"

import { useState } from "react"
import { FileText, LogOut, Menu, Shield, User } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { SearchBar } from "@/components/search/SearchBar"

interface MobileNavProps {
  links: { href: string; label: string }[]
  user?: WriterMenuUser | null
}

export function MobileNav({ links, user }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const menuUser = user ?? null

  function handleSignOut() {
    setOpen(false)
    void signOut({ callbackUrl: "/" })
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label="Mở menu điều hướng"
          className="h-8 w-8 rounded-full text-text-secondary hover:bg-subtle-bg hover:text-text-primary md:hidden"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-[280px] flex-col border-border-default bg-background px-6 py-6 overflow-y-auto" side="right">
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        <SheetDescription className="sr-only">
          Duyệt các trang ấn phẩm và tìm kiếm bài viết.
        </SheetDescription>
        <div className="mb-8 flex items-center justify-between pr-8">
          <span className="text-[16px] font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"}
          </span>
        </div>

        <nav aria-label="Mobile navigation" className="flex flex-col gap-6">
          {links.map((link) => (
            <Link
              className="text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-border-default pt-6">
          <SearchBar />
        </div>

        <div className="mt-6 border-t border-border-default pt-6 flex flex-col gap-4">
          <a
            href="https://discord.gg/wgCr86Cdb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-accent transition-colors"
          >
            <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-5 h-5">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C3.12,31.78-1.2,54.85,.3,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3A75.7,75.7,0,0,0,96,78.23c.93,.8,1.93,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.71-18.83C128.7,54.85,124.3,31.78,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
            Tham gia Discord
          </a>
        </div>

        {menuUser ? (
          <div className="mt-6 border-t border-border-default pt-6">
            <div className="pb-4">
              <p className="truncate text-sm font-medium text-text-primary">{menuUser.name}</p>
              <p className="truncate text-xs text-text-tertiary">
                @{menuUser.username}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                href="/dashboard"
                onClick={() => setOpen(false)}
                prefetch={false}
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                Bài viết của tôi
              </Link>
              {menuUser.role === "ADMIN" && (
                <>
                  <Link
                    className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                    href="/admin/analytics"
                    onClick={() => setOpen(false)}
                    prefetch={false}
                  >
                    <Shield aria-hidden="true" className="h-4 w-4" />
                    Thống kê & Nội dung
                  </Link>
                  <Link
                    className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                    href="/admin/events"
                    onClick={() => setOpen(false)}
                    prefetch={false}
                  >
                    <Shield aria-hidden="true" className="h-4 w-4" />
                    Quản lý Sự kiện
                  </Link>
                  <Link
                    className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                    href="/admin"
                    onClick={() => setOpen(false)}
                    prefetch={false}
                  >
                    <Shield aria-hidden="true" className="h-4 w-4" />
                    Quản trị Hệ thống
                  </Link>
                </>
              )}
              <Link
                className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                prefetch={false}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                Sửa hồ sơ
              </Link>
              <Link
                className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                href={`/authors/${menuUser.username}`}
                onClick={() => setOpen(false)}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                Hồ sơ công khai
              </Link>
              <Button
                className="min-h-9 justify-start gap-2 px-0 text-accent hover:bg-transparent hover:text-accent/80"
                onClick={handleSignOut}
                type="button"
                variant="ghost"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
