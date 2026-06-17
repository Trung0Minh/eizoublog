"use client"

import { useEffect, useState } from "react"
import { Bell, ChevronDown, FileText, LogOut, PartyPopper, Shield, User } from "lucide-react"
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
import {
  loadSessionUser,
  type ClientSessionUser,
} from "@/lib/clientSession"
import { cn } from "@/lib/utils"

export type WriterMenuUser = ClientSessionUser

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

function readCount(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "count" in value.data &&
    typeof value.data.count === "number"
  ) {
    return value.data.count
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "count" in value &&
    typeof value.count === "number"
  ) {
    return value.count
  }

  return 0
}

function readNotificationCounts(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "counts" in value.data &&
    typeof value.data.counts === "object" &&
    value.data.counts !== null
  ) {
    const counts = value.data.counts
    return {
      pendingInvites:
        "pendingInvites" in counts && typeof counts.pendingInvites === "number"
          ? counts.pendingInvites
          : 0,
      responseEvents:
        "responseEvents" in counts && typeof counts.responseEvents === "number"
          ? counts.responseEvents
          : 0,
      unreadComments:
        "unreadComments" in counts && typeof counts.unreadComments === "number"
          ? counts.unreadComments
          : 0,
    }
  }

  return null
}

export function WriterMenu({ user }: { user?: WriterMenuUser | null }) {
  const [loadedUser, setLoadedUser] = useState<WriterMenuUser | null>(null)
  const [pendingInvites, setPendingInvites] = useState(0)
  const [responseEvents, setResponseEvents] = useState(0)
  const [unreadComments, setUnreadComments] = useState(0)

  useEffect(() => {
    if (user !== undefined) return

    let isMounted = true

    async function loadSession() {
      try {
        const sessionUser = await loadSessionUser()
        if (isMounted) {
          setLoadedUser(sessionUser)
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

  useEffect(() => {
    if (!menuUser) return

    let isMounted = true

    async function loadNotificationCounts() {
      try {
        const response = await fetch("/api/user/notifications")
        const result = response.ok ? await response.json() : null
        const counts = readNotificationCounts(result)

        if (isMounted) {
          setPendingInvites(counts?.pendingInvites ?? readCount(result))
          setResponseEvents(counts?.responseEvents ?? 0)
          setUnreadComments(counts?.unreadComments ?? 0)
        }
      } catch {
        if (isMounted) {
          setPendingInvites(0)
          setResponseEvents(0)
          setUnreadComments(0)
        }
      }
    }

    void loadNotificationCounts()
    window.addEventListener("notifications:changed", loadNotificationCounts)

    return () => {
      isMounted = false
      window.removeEventListener(
        "notifications:changed",
        loadNotificationCounts,
      )
    }
  }, [menuUser])

  if (!menuUser) return null

  const totalNotifications = pendingInvites + responseEvents + unreadComments

  return (
    <DropdownMenu>
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
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/events" prefetch={false}>
            <PartyPopper aria-hidden="true" />
            Sự kiện viết
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/notifications"
            prefetch={false}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Bell aria-hidden="true" />
              Thông báo
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
