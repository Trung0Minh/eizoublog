"use client"

import { Check, ShieldAlert, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
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
  const [spamTarget, setSpamTarget] = useState<AdminComment | null>(null)

  async function handleMarkSpam(comment: AdminComment) {
    setSpammingId(comment.id)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setSpamTarget(null)
      toast.success("Comment marked as spam", {
        description: `${comment.authorName}'s comment is now hidden.`,
      })
      router.refresh()
    } catch (error) {
      toast.error("Failed to hide comment", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setSpammingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-12 text-center text-[14px] text-text-tertiary shadow-sm">
        {emptyLabel}
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col">
      {comments.map((comment, index) => (
        <article
          className="group flex flex-col gap-4 border-b border-border-default/50 px-2 py-6 transition-colors last:border-0 hover:bg-white/40 dark:hover:bg-white/5 sm:flex-row sm:items-start animate-in fade-in slide-in-from-bottom-2 sm:px-6 rounded-lg"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
          key={comment.id}
        >
          <div className="hidden shrink-0 pt-1 sm:block">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border-default text-[15px] font-bold text-text-secondary shadow-sm">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[16px] font-bold text-text-primary">
                {comment.authorName}
              </span>
              <span className="rounded-full border border-border-default/60 bg-background/50 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                {status === "SPAM" ? "Hidden" : "Reader"}
              </span>
              <span className="px-1 text-[12px] text-text-tertiary">·</span>
              <span className="text-[12px] font-medium text-text-tertiary">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            <div className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
              <span>on</span>
              <Link
                className="max-w-[200px] truncate font-semibold text-text-primary hover:text-accent hover:underline sm:max-w-[400px]"
                href={`/${comment.post.slug}`}
                prefetch={false}
              >
                {comment.post.title}
              </Link>
            </div>

            <div className="pl-0 sm:pl-1">
              <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-text-secondary">
                {comment.content}
              </p>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center gap-1 sm:mt-0 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            {status === "PENDING" && (
              <>
                <button className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#15803d]/10 px-3 text-[12px] font-bold text-[#15803d] transition-colors hover:bg-[#15803d]/20 dark:bg-[#4ade80]/10 dark:text-[#4ade80] dark:hover:bg-[#4ade80]/20">
                  <Check aria-hidden="true" className="h-4 w-4" />
                  Approve
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
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
                className="h-8 rounded-[8px] px-3 text-[12px] font-semibold text-text-secondary hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border-none bg-transparent"
                disabled={spammingId === comment.id}
                onClick={() => setSpamTarget(comment)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <ShieldAlert aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Mark spam
              </Button>
            )}

            {status === "SPAM" && (
              <button
                className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
                type="button"
              >
                <Check aria-hidden="true" className="h-4 w-4" />
                Not Spam
              </button>
            )}

            <button
              aria-label="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-text-tertiary transition-colors hover:bg-destructive/10 hover:text-destructive"
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
      <ConfirmationDialog
        cancelLabel="Keep visible"
        confirmLabel="Mark as spam"
        description={
          spamTarget ? (
            <>
              Hide the comment from <strong className="text-text-primary">{spamTarget.authorName}</strong>:
              <span className="mt-2 block line-clamp-3 rounded-[8px] border border-border-default bg-subtle-bg/60 p-3 text-[13px]">
                {spamTarget.content}
              </span>
            </>
          ) : null
        }
        icon={ShieldAlert}
        onConfirm={() => spamTarget && void handleMarkSpam(spamTarget)}
        onOpenChange={(open) => !open && setSpamTarget(null)}
        open={spamTarget !== null}
        pending={spammingId !== null}
        title="Mark comment as spam?"
        tone="warning"
      />
    </>
  )
}
