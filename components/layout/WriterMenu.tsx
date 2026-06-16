"use client"

import { useEffect, useState } from "react"
import { ChevronDown, FileText, LogOut, Shield, User } from "lucide-react"
import type { Role } from "@prisma/client"
import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface WriterMenuUser {
  avatarUrl: string | null
  name: string
  role?: Role
  username: string
}

function getSessionRole(value: unknown): Role | undefined {
  return value === "ADMIN" || value === "WRITER" || value === "REVOKED"
    ? value
    : undefined
}

export function getSessionUser(value: unknown): WriterMenuUser | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof value.user === "object" &&
    value.user !== null &&
    "name" in value.user &&
    "username" in value.user &&
    typeof value.user.name === "string" &&
    typeof value.user.username === "string"
  ) {
    return {
      avatarUrl:
        "avatarUrl" in value.user && typeof value.user.avatarUrl === "string"
          ? value.user.avatarUrl
          : null,
      name: value.user.name,
      role: "role" in value.user ? getSessionRole(value.user.role) : undefined,
      username: value.user.username,
    }
  }

  return null
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  )
}

function WriterAvatar({
  className,
  user,
}: {
  className?: string
  user: WriterMenuUser
}) {
  if (user.avatarUrl) {
    return (
      <img
        alt={user.name}
        className={cn("rounded-full object-cover", className)}
        src={user.avatarUrl}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border-default bg-subtle-bg text-xs font-semibold text-text-primary",
        className,
      )}
    >
      {getInitials(user.name)}
    </span>
  )
}

export function WriterMenu({ user }: { user?: WriterMenuUser | null }) {
  const [loadedUser, setLoadedUser] = useState<WriterMenuUser | null>(null)
  const [pendingInvites, setPendingInvites] = useState(0)
  const [unreadComments, setUnreadComments] = useState(0)

  useEffect(() => {
    if (user !== undefined) return

    let isMounted = true

    async function loadSession() {
      try {
        const [sessionRes, invitesRes, commentsRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/user/pending-invites-count"),
          fetch("/api/user/unread-comments-count"),
        ])
        
        if (sessionRes.ok) {
          const result: unknown = await sessionRes.json()
          if (isMounted) {
            setLoadedUser(getSessionUser(result))
          }
        }

        if (invitesRes.ok) {
          const result = await invitesRes.json()
          if (isMounted && typeof result.count === "number") {
            setPendingInvites(result.count)
          }
        }

        if (commentsRes.ok) {
          const result = await commentsRes.json()
          if (isMounted && typeof result.count === "number") {
            setUnreadComments(result.count)
          }
        }
      } catch {
        if (isMounted) {
          setLoadedUser(null)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [user])

  const menuUser = user !== undefined ? user : loadedUser

  if (!menuUser) return null

  const handleOpenChange = (open: boolean) => {
    if (open && unreadComments > 0) {
      setUnreadComments(0)
      fetch("/api/user/mark-comments-read", { method: "POST" }).catch(console.error)
    }
  }

  const totalNotifications = pendingInvites + unreadComments

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        aria-label="Mở menu tác giả"
        className="relative inline-flex h-8 items-center gap-1.5 rounded-full px-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <WriterAvatar className="h-6 w-6" user={menuUser} />
        {totalNotifications > 0 && (
          <span className="absolute right-4 top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white outline outline-2 outline-background ring-2 ring-background">
          </span>
        )}
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <WriterAvatar className="h-8 w-8" user={menuUser} />
          <span className="min-w-0">
            <span className="block truncate text-sm text-text-primary">{menuUser.name}</span>
            <span className="block truncate text-xs font-normal text-text-tertiary">
              @{menuUser.username}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" prefetch={false} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText aria-hidden="true" />
              Bài viết của tôi
            </div>
            {totalNotifications > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {totalNotifications}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        {menuUser.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" prefetch={false}>
              <Shield aria-hidden="true" />
              Quản trị
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" prefetch={false}>
            <User aria-hidden="true" />
            Sửa hồ sơ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/authors/${menuUser.username}`}>
            <User aria-hidden="true" />
            Hồ sơ công khai
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-text-secondary"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
