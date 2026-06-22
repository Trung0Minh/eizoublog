"use client"

import { Check, ShieldAlert, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface AdminComment {
  authorName: string
  content: string
  createdAt: Date
  id: string
  post: { slug: string; title: string }
  status: "APPROVED" | "SPAM"
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

export function AdminCommentsTable({
  comments,
  emptyLabel = "No approved comments found.",
  status = "APPROVED",
}: {
  comments: AdminComment[]
  emptyLabel?: string
  status?: "APPROVED" | "PENDING" | "SPAM"
}) {
  const router = useRouter()
  const [spammingId, setSpammingId] = useState<string | null>(null)

  async function handleMarkSpam(comment: AdminComment) {
    if (!confirm("Mark this comment as spam and hide it?")) return

    setSpammingId(comment.id)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to hide comment")
    } finally {
      setSpammingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-8 text-center text-[13px] text-text-tertiary shadow-sm">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md shadow-sm transition-all hover:border-accent/40">
      {comments.map((comment) => (
        <article
          className="group flex flex-col gap-4 border-b border-border-default p-6 transition-colors last:border-0 hover:bg-accent/5 md:flex-row"
          key={comment.id}
        >
          <div className="hidden shrink-0 pt-1 md:block">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border-default text-[13px] font-semibold text-text-secondary">
              {comment.authorName.charAt(0)}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[14px] font-semibold text-text-primary">
                {comment.authorName}
              </span>
              <span className="text-[12px] text-text-tertiary">
                {status === "SPAM" ? "Hidden" : "Reader"}
              </span>
              <span className="px-1 text-[12px] text-text-tertiary">·</span>
              <span className="text-[12px] text-text-tertiary">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
              <span>on</span>
              <Link
                className="max-w-[200px] truncate font-medium text-text-primary hover:text-accent hover:underline md:max-w-[300px]"
                href={`/${comment.post.slug}`}
                prefetch={false}
              >
                {comment.post.title}
              </Link>
            </div>

            <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.5] text-text-primary">
              {comment.content}
            </p>
          </div>

          <div className="mt-2 flex shrink-0 items-start gap-1.5 md:mt-0">
            {status === "PENDING" && (
              <>
                <button className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#15803d]/20 bg-[#f0fdf4] px-3 text-[12px] font-semibold text-[#15803d] transition-opacity hover:opacity-80 dark:bg-[#14532d30] dark:text-[#4ade80]">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-border-default text-text-secondary transition-all hover:border-text-tertiary hover:bg-background"
                  title="Mark as spam"
                  type="button"
                >
                  <ShieldAlert aria-hidden="true" className="h-4 w-4" />
                </button>
              </>
            )}

            {status === "APPROVED" && (
              <Button
                aria-label="Mark as spam"
                className="h-8 border border-border-default px-3 text-[12px] font-medium text-text-secondary hover:bg-subtle-bg hover:text-accent"
                disabled={spammingId === comment.id}
                onClick={() => void handleMarkSpam(comment)}
                size="sm"
                type="button"
                variant="outline"
              >
                Mark spam
              </Button>
            )}

            {status === "SPAM" && (
              <button
                className="flex h-8 items-center gap-1.5 rounded-[5px] border border-border-default bg-background px-3 text-[12px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg"
                type="button"
              >
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                Not Spam
              </button>
            )}

            <button
              aria-label="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-transparent text-text-tertiary transition-all hover:bg-[#fef2f2] hover:text-accent dark:hover:bg-[#3f0f0f40]"
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
