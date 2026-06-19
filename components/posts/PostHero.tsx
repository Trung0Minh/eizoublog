import { Sparkles } from "lucide-react"

import { formatDate } from "@/lib/utils"
import { getCoverStyle } from "@/lib/cover-style"
import { PostHeaderPost } from "./PostHeader"

interface PostHeroProps {
  post: PostHeaderPost
  authorUsernames?: string[]
}

export function PostHero({ post }: PostHeroProps) {
  const author = post.author
  const coAuthor = post.coAuthors[0]?.user

  return (
    <div className="w-full h-[40vh] md:h-[60vh] lg:h-[70vh] relative -mt-[1px]">
      {post.coverUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={(post.coverUrl || "").split('?')[0]}
            alt={post.coverAlt || post.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={getCoverStyle(post.coverUrl)}
            decoding="async"
            fetchPriority="high"
            loading="eager"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end pb-8 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[720px] mx-auto w-full">
          {post.category && (
            <div className="text-[11px] font-bold text-white bg-accent px-3 py-1 rounded-full uppercase tracking-[0.1em] w-max mb-4 shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3"/> {post.category.name}
            </div>
          )}
          <h1 className="text-[28px] md:text-[44px] lg:text-[52px] font-display font-bold text-text-primary leading-[1.1] tracking-[-0.02em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-[12px] bg-background/95 backdrop-blur-md w-max p-2 pr-4 rounded-full border border-border-default shadow-md select-none">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[14px] outline outline-2 outline-background z-10 font-bold overflow-hidden">
                {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="w-full h-full object-cover"/> : author.name.charAt(0)}
              </div>
              {coAuthor && (
                <div className="w-9 h-9 rounded-full bg-[#c47f5a] flex justify-center items-center text-white text-[14px] outline outline-2 outline-background -ml-[12px] z-20 font-bold overflow-hidden">
                  {coAuthor.avatarUrl ? <img src={coAuthor.avatarUrl} alt="" className="w-full h-full object-cover"/> : coAuthor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center text-[13px] text-text-primary font-bold">
              <div className="flex items-center gap-1">
                <span className="text-text-primary font-bold">{author.name}</span>
                {coAuthor && (
                  <>
                    <span className="text-text-secondary font-medium">&amp;</span>
                    <span className="text-text-primary font-bold">{coAuthor.name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center text-text-secondary hidden sm:flex mx-2">&middot;</div>
              <div className="flex items-center text-text-secondary font-medium">
                {post.publishedAt && (
                  <>
                    <span>{formatDate(post.publishedAt)}</span>
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
        </div>
      </div>
    </div>
  )
}
