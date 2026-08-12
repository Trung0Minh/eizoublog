'use client';

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"
import type { JSONContent } from "@tiptap/react"

import { RelativeTime } from "@/components/ui/RelativeTime"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { getCoverStyle } from "@/lib/cover-style"
import { cn } from "@/lib/utils"
import { PostInlineActions } from "@/components/posts/PostInlineActions"
import type { PostHeroPost } from "@/types/posts"
import { PostBody } from "@/components/posts/PostBody"

function isRichSubtitle(value: unknown): value is JSONContent {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasMeaningfulSubtitle(node: JSONContent): boolean {
  if (node.type === "text") {
    return Boolean(node.text?.trim())
  }

  if (node.content?.some(hasMeaningfulSubtitle)) {
    return true
  }

  return Boolean(
    node.type &&
      ![
        "blockquote",
        "bulletList",
        "doc",
        "heading",
        "listItem",
        "orderedList",
        "paragraph",
      ].includes(node.type),
  )
}

interface PostHeroProps {
  post: PostHeroPost
  authorUsernames?: string[]
  hasTableOfContents?: boolean
}

export function PostHero({
  post,
  authorUsernames,
  hasTableOfContents = false,
}: PostHeroProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]
  const richSubtitle = isRichSubtitle(post.excerptContent) &&
    hasMeaningfulSubtitle(post.excerptContent)
  const hasSubtitle = richSubtitle || Boolean(post.excerpt?.trim())

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 400])

  return (
    <div
      className={cn(
        "relative -mt-[64px] w-full overflow-hidden pt-[64px] md:-mt-[88px] md:pt-[88px]",
        post.coverUrl
          ? "h-[calc(50dvh+64px)] min-h-[calc(450px+64px)] md:h-[calc(60vh+88px)] md:min-h-[calc(500px+88px)] lg:h-[calc(70vh+88px)] lg:min-h-[calc(600px+88px)]"
          : "bg-transparent",
      )}
      data-testid={post.coverUrl ? undefined : "post-hero-no-cover"}
    >
      {post.coverUrl && (
        <motion.div style={{ y }} className="absolute inset-0 right-0 left-0 bottom-0 top-0 h-full md:top-[-20vh] md:h-[120%]">
          <img
            src={(post.coverUrl || "").split('?')[0]}
            alt={post.coverAlt || post.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={getCoverStyle(post.coverUrl)}
            decoding="async"
            fetchPriority="high"
            loading="eager"
          />
        </motion.div>
      )}
      <div
        className={cn(
          "flex flex-col",
          post.coverUrl
            ? "absolute inset-0 justify-end bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.92)_14%,hsl(var(--background)/0.68)_36%,hsl(var(--background)/0.28)_64%,transparent_100%)] pb-8 md:pb-16"
            : "relative justify-center py-10 md:py-12 lg:py-14",
        )}
        data-testid="post-hero-content"
      >
        <div className="mx-auto flex w-full max-w-[1440px] justify-center">
          <div className="w-full max-w-[1100px] shrink-0 px-4 md:px-6" data-testid="post-hero-main-column">
            <ScrollReveal delay={0.1}>
              {post.category && (
                <div className="text-[11px] font-bold text-white bg-accent px-3 py-1 rounded-full uppercase tracking-[0.1em] w-max mb-4 shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3"/> {post.category.name}
                </div>
              )}
            </ScrollReveal>
            <h1 className={cn(
              "font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-text-primary md:text-[44px] lg:text-[52px]",
              hasSubtitle ? "mb-4" : "mb-3",
              post.coverUrl && "drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]",
            )}>
              <TextReveal text={post.title} />
            </h1>
            {richSubtitle ? (
              <ScrollReveal delay={0.15}>
                <div className="mb-8 max-w-[90%] text-[15px] leading-[1.6] text-text-secondary md:text-[18px] [&_.ProseMirror]:!m-0 [&_.ProseMirror]:!max-w-none [&_.ProseMirror>*]:!m-0">
                  <PostBody content={post.excerptContent} presentation="embedded" />
                </div>
              </ScrollReveal>
            ) : post.excerpt ? (
              <ScrollReveal delay={0.15}>
                <p className="text-[15px] md:text-[18px] text-text-secondary leading-[1.6] mb-8 max-w-[90%]">
                  {post.excerpt}
                </p>
              </ScrollReveal>
            ) : null}

            <ScrollReveal
              className="flex flex-wrap items-center gap-3"
              data-testid="post-hero-meta-row"
              delay={0.2}
            >
              <div
                className="flex w-fit min-w-0 items-center gap-[12px] rounded-full border border-border-default bg-background/95 p-2 pr-4 shadow-md backdrop-blur-md select-none"
                data-testid="post-author-card"
              >
                <div className="flex items-center">
                  {authors.map((displayAuthor, index) => (
                    <div
                      className="w-9 h-9 rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[14px] outline outline-2 outline-background font-bold overflow-hidden"
                      key={displayAuthor.username}
                      style={{
                        marginLeft: index === 0 ? 0 : -12,
                        zIndex: index + 10,
                      }}
                    >
                      {displayAuthor.avatarUrl ? (
                        <img src={displayAuthor.avatarUrl} alt="" className="w-full h-full object-cover"/>
                      ) : (
                        displayAuthor.name.charAt(0)
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex min-w-0 flex-col text-[13px] font-bold text-text-primary sm:flex-row sm:items-center">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-bold text-text-primary sm:overflow-visible">
                      {authors.map(({ name }) => name).join(" & ")}
                    </span>
                  </div>
                  <div className="flex items-center text-text-secondary hidden sm:flex mx-2">&middot;</div>
                  <div className="flex items-center text-text-secondary font-medium">
                    {post.publishedAt && (
                      <>
                        <RelativeTime date={post.publishedAt} />
                      </>
                    )}
                    {post._count !== undefined && (
                      <>
                        <span className="mx-2">&middot;</span>
                        <span>{post._count.comments} bình luận</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {authorUsernames && (
                <>
                  <PostInlineActions
                    authorUsernames={authorUsernames}
                    featuredAt={post.featuredAt}
                    postId={post.id}
                    splitAdminActionsOnMobile
                    status={post.status}
                  />
                </>
              )}
            </ScrollReveal>

            {post.tags.length > 0 && (
              <ScrollReveal delay={0.25}>
                <div className="mt-4 flex w-full flex-wrap items-center gap-2">
                  {post.tags.map(({ tag }) => (
                    <Link
                      className="hover-glitch cursor-pointer rounded-full border border-accent/20 bg-accent/10 px-[12px] py-[6px] text-[11px] font-semibold text-accent"
                      href={`/tag/${tag.slug}`}
                      key={tag.slug}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>

          {hasTableOfContents && (
            <div
              aria-hidden="true"
              className="ml-10 hidden w-[200px] shrink-0 2xl:block"
              data-testid="post-hero-toc-spacer"
            />
          )}
        </div>
      </div>
    </div>
  )
}
