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
      <SheetContent className="flex w-[280px] flex-col border-border-default bg-background px-6 py-6" side="right">
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
                <Link
                  className="flex min-h-9 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                  href="/admin"
                  onClick={() => setOpen(false)}
                  prefetch={false}
                >
                  <Shield aria-hidden="true" className="h-4 w-4" />
                  Quản trị
                </Link>
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
