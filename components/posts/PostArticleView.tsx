import type { JSONContent } from "@tiptap/react"
import Link from "next/link"
import type { ReactNode } from "react"

import { AuthorCreditList } from "@/components/posts/AuthorCreditList"
import { PostBody } from "@/components/posts/PostBody"
import { PostHero } from "@/components/posts/PostHero"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { extractHeadings } from "@/lib/postHeadings"
import type { PostHeroPost } from "@/types/posts"

interface PostArticleViewProps {
  authorUsernames: string[]
  children?: ReactNode
  content: JSONContent
  post: PostHeroPost
}

export function PostArticleView({
  authorUsernames,
  children,
  content,
  post,
}: PostArticleViewProps) {
  const creditAuthors = [post.author, ...post.coAuthors.map(({ user }) => user)]
  const hasTableOfContents = extractHeadings(content).length > 0
  const tags = post.tags.map(({ tag }) => tag)

  return (
    <div className="contents" data-testid="post-article-view">
      <PostHero post={post} authorUsernames={authorUsernames} />

      {post.coverUrl && (
        <div className="pointer-events-none relative z-0 h-0 w-full">
          <div className="absolute left-0 right-0 top-[-1px] h-40 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,hsl(var(--background)/0.86)_24%,hsl(var(--background)/0.42)_62%,transparent_100%)] md:h-56 lg:h-72" />
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 justify-center pb-20 pt-0 xl:px-12">
        <main className="w-full max-w-[1000px] px-4 md:px-5 xl:px-0">
          <header className="flex flex-col">
            <ScrollReveal delay={0.1}>
              {post.coverAlt && (
                <div className="-mt-1 mb-1 pr-1 text-right text-[13px] font-medium italic text-text-tertiary md:text-[14px]">
                  {post.coverAlt}
                </div>
              )}
              <div className="hide-scrollbar flex items-center gap-[6px] overflow-x-auto whitespace-nowrap pb-1">
                {tags.map((tag) => (
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
          </header>

          <article className="post-content mx-auto mt-4 w-full font-lora text-[16px] leading-[1.75] text-text-primary md:mt-6 md:text-[17.5px] md:leading-[1.8]">
            <ScrollReveal delay={0.2}>
              <div className="relative z-30 mb-5 overflow-hidden rounded-[16px] border border-border-default/60 bg-background/90 px-4 py-5 backdrop-blur-sm sm:mb-8 sm:rounded-[8px] sm:bg-subtle-bg/90 sm:p-8 md:p-10">
                <PostBody content={content} />
              </div>
            </ScrollReveal>
          </article>

          <div className="mx-auto w-full font-lora text-[16px] md:text-[17.5px]">
            <div className="font-sans text-text-primary">
              <ScrollReveal delay={0.3}>
                <AuthorCreditList
                  authors={creditAuthors}
                  className="mt-6 md:mt-8"
                />
              </ScrollReveal>
              {children}
            </div>
          </div>
        </main>

        {hasTableOfContents && (
          <aside className="sticky top-24 ml-10 mt-12 hidden max-h-[calc(100vh-120px)] w-[200px] shrink-0 self-start overflow-y-auto overscroll-contain no-scrollbar xl:block">
            <ScrollReveal delay={0.5}>
              <TableOfContents content={content} />
            </ScrollReveal>
          </aside>
        )}
      </div>
    </div>
  )
}
