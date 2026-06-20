"use client"

import { Pencil } from "lucide-react"
import Link from "next/link"

import { useSessionUser } from "@/lib/clientSession"

interface PostEditLinkProps {
  authorUsernames: string[]
  postId: string
}

export function PostEditLink({ authorUsernames, postId }: PostEditLinkProps) {
  const { user } = useSessionUser()

  if (!user?.username || !authorUsernames.includes(user.username)) {
    return null
  }

  return (
    <Link
      href={`/dashboard/edit/${postId}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border-default/80 bg-background/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-text-primary shadow-sm transition-all duration-300 hover:bg-background/90 hover:border-accent/40 hover:shadow-md hover:scale-[1.02]"
    >
      <Pencil className="h-3.5 w-3.5 text-accent" />
      Chỉnh sửa
    </Link>
  )
}
