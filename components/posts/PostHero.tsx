'use client';

import { Sparkles } from "lucide-react"
import { motion, useScroll, useTransform } from "motion/react"

import { RelativeTime } from "@/components/ui/RelativeTime"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { getCoverStyle } from "@/lib/cover-style"
import { PostEditLink } from "./PostEditLink"
import type { PostHeroPost } from "@/types/posts"

interface PostHeroProps {
  post: PostHeroPost
  authorUsernames?: string[]
}

export function PostHero({ post, authorUsernames }: PostHeroProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 400])

  return (
    <div className="w-full min-h-[calc(450px+88px)] h-[calc(50dvh+88px)] md:min-h-[calc(500px+88px)] md:h-[calc(60vh+88px)] lg:min-h-[calc(600px+88px)] lg:h-[calc(70vh+88px)] relative -mt-[88px] pt-[88px] overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end pb-8 md:pb-16">
        <div className="w-full max-w-[1000px] mx-auto px-4 md:px-5 xl:px-0">
          <ScrollReveal delay={0.1}>
            {post.category && (
              <div className="text-[11px] font-bold text-white bg-accent px-3 py-1 rounded-full uppercase tracking-[0.1em] w-max mb-4 shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3"/> {post.category.name}
              </div>
            )}
          </ScrollReveal>
          <h1 className="text-[28px] md:text-[44px] lg:text-[52px] font-display font-bold text-text-primary leading-[1.1] tracking-[-0.02em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] mb-4">
            <TextReveal text={post.title} />
          </h1>
          {post.excerpt && (
            <ScrollReveal delay={0.15}>
              <p className="text-[15px] md:text-[18px] text-text-secondary leading-[1.6] mb-8 max-w-[90%]">
                {post.excerpt}
              </p>
            </ScrollReveal>
          )}

          <ScrollReveal delay={0.2} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-[12px] bg-background/95 backdrop-blur-md p-2 pr-4 rounded-full border border-border-default shadow-md select-none">
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
              <div className="flex flex-col sm:flex-row sm:items-center text-[13px] text-text-primary font-bold">
                <div className="flex items-center gap-1">
                  <span className="text-text-primary font-bold">
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
              <PostEditLink authorUsernames={authorUsernames} postId={post.id} />
            )}
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
