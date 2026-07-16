"use client"

import { useState } from "react"
import { Reply } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { CommentForm } from "@/components/comments/CommentForm"
import { RoleBadges } from "@/components/profile/RoleBadges"
import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/ui/RelativeTime"
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
  postAuthorUsernames = [],
}: {
  comment: PublicComment
  postAuthorUsernames?: string[]
}) {
  const isPostAuthor = comment.author?.username && postAuthorUsernames.includes(comment.author.username)
  const role = comment.author?.role

  return (
    <div className="flex gap-3">
      {comment.author?.avatarUrl ? (
        <img
          alt={comment.authorName}
          className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
          src={comment.author.avatarUrl}
        />
      ) : (
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: avatarColor(comment.authorName) }}
        >
          {getInitial(comment.authorName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold text-text-primary">
            {comment.authorName}
          </span>
          {isPostAuthor && (
            <span className="rounded-[4px] bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Tác giả
            </span>
          )}
          <RoleBadges
            displayRoleColor={comment.author?.displayRoleColor ?? null}
            displayRoleName={comment.author?.displayRoleName ?? null}
            role={role ?? ""}
          />
          <RelativeTime
            className="text-[12px] text-text-tertiary"
            date={comment.createdAt}
          />
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
      className="scroll-mt-24 border-t border-border-default pt-4 first:border-t-0 first:pt-0"
      id={`comment-${comment.id}`}
    >
      <CommentBubble comment={comment} postAuthorUsernames={postAuthorUsernames} />
      <div className="mt-1 pl-11">
        <Button
          aria-label={`Trả lời bình luận của ${comment.authorName}`}
          className="h-auto min-h-0 px-0 py-1 text-[12px] text-text-tertiary hover:bg-transparent hover:text-text-primary"
          onClick={() => setIsReplying((value) => !value)}
          type="button"
          variant="ghost"
        >
          <Reply aria-hidden="true" className="w-3 h-3 mr-1" />
          {isReplying ? "Hủy trả lời" : "Trả lời"}
        </Button>
      </div>

      <AnimatePresence>
        {isReplying && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-3 border-l border-border-default pl-4 sm:ml-11"
          >
            <CommentForm
              ariaLabel={`Trả lời ${comment.authorName}`}
              onCancel={() => setIsReplying(false)}
              onSuccess={handleReply}
              parentId={comment.id}
              postId={postId}
              postSlug={postSlug}
              isAuthenticated={isAuthenticated}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-4 border-l border-border-default pl-4 sm:ml-11">
          {comment.replies.map((reply) => (
            <article
              className="scroll-mt-24"
              id={`comment-${reply.id}`}
              key={reply.id}
            >
              <CommentBubble comment={reply} postAuthorUsernames={postAuthorUsernames} />
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
