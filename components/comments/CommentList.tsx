"use client"

import { useState } from "react"
import { Reply } from "lucide-react"

import { CommentForm } from "@/components/comments/CommentForm"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { CommentWithReplies, PublicComment } from "@/types"

interface CommentListProps {
  comments: CommentWithReplies[]
  onReply: (comment: CommentWithReplies) => void
  postId: string
  postSlug?: string
  isAuthenticated?: boolean
  postAuthorUsernames?: string[]
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

function avatarColor(name: string) {
  const colors = ["#4a6fa5", "#4a7c59", "#7b5ea7", "#c47f5a", "#2d6e7e"]
  const total = Array.from(name).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  )

  return colors[total % colors.length]
}

function CommentBubble({
  comment,
  isReply,
  postAuthorUsernames = [],
}: {
  comment: PublicComment
  isReply?: boolean
  postAuthorUsernames?: string[]
}) {
  const isPostAuthor = comment.author?.username && postAuthorUsernames.includes(comment.author.username)
  const role = comment.author?.role

  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: avatarColor(comment.authorName) }}
      >
        {getInitial(comment.authorName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold text-text-primary">
            {comment.authorName}
          </span>
          {isPostAuthor && (
            <span className="rounded-[4px] bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              Tác giả
            </span>
          )}
          {role === "ADMIN" && (
            <span className="rounded-[4px] bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Admin
            </span>
          )}
          {role === "WRITER" && !isPostAuthor && (
            <span className="rounded-[4px] bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Writer
            </span>
          )}
          <time
            className="text-[12px] text-text-tertiary"
            dateTime={new Date(comment.createdAt).toISOString()}
          >
            {formatDate(comment.createdAt)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-text-secondary">
          {comment.content}
        </p>
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  onReply,
  postId,
  postSlug,
  isAuthenticated,
  postAuthorUsernames,
}: {
  comment: CommentWithReplies
  onReply: (comment: CommentWithReplies) => void
  postId: string
  postSlug?: string
  isAuthenticated?: boolean
  postAuthorUsernames?: string[]
}) {
  const [isReplying, setIsReplying] = useState(false)

  function handleReply(commentReply: CommentWithReplies) {
    onReply(commentReply)
    setIsReplying(false)
  }

  return (
    <article
      className="scroll-mt-24 border-t border-border-default pt-6 first:border-t-0 first:pt-0"
      id={`comment-${comment.id}`}
    >
      <CommentBubble comment={comment} postAuthorUsernames={postAuthorUsernames} />
      <div className="mt-3 pl-11">
        <Button
          aria-label={`Trả lời bình luận của ${comment.authorName}`}
          className="h-auto min-h-0 px-0 py-1 text-[12px] text-text-tertiary hover:bg-transparent hover:text-text-primary"
          onClick={() => setIsReplying((value) => !value)}
          type="button"
          variant="ghost"
        >
          <Reply aria-hidden="true" />
          {isReplying ? "Hủy trả lời" : "Trả lời"}
        </Button>
      </div>

      {isReplying && (
        <div className="mt-4 border-l border-border-default pl-4 sm:ml-11">
          <CommentForm
            ariaLabel={`Trả lời ${comment.authorName}`}
            onCancel={() => setIsReplying(false)}
            onSuccess={handleReply}
            parentId={comment.id}
            postId={postId}
            postSlug={postSlug}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-5 space-y-4 border-l border-border-default pl-4 sm:ml-11">
          {comment.replies.map((reply) => (
            <article
              className="scroll-mt-24"
              id={`comment-${reply.id}`}
              key={reply.id}
            >
              <CommentBubble comment={reply} isReply postAuthorUsernames={postAuthorUsernames} />
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

export function CommentList({
  comments,
  onReply,
  postId,
  postSlug,
  isAuthenticated,
  postAuthorUsernames = [],
}: CommentListProps) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentThread
          comment={comment}
          key={comment.id}
          onReply={onReply}
          postId={postId}
          postSlug={postSlug}
          isAuthenticated={isAuthenticated}
          postAuthorUsernames={postAuthorUsernames}
        />
      ))}
    </div>
  )
}
