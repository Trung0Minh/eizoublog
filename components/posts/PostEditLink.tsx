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
      className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-subtle-bg"
    >
      <Pencil className="h-3.5 w-3.5" />
      Edit Post
    </Link>
  )
}
