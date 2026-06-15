import Link from "next/link"
import { StaticPostContent } from "@/components/posts/StaticPostContent"

interface AuthorBioAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

interface AuthorBioProps {
  author: AuthorBioAuthor
}

function fallbackBio(authorName: string) {
  return `${authorName} viết về quá trình sản xuất anime, nghệ thuật kể chuyện qua hình ảnh và kỹ thuật đằng sau hoạt hình đương đại.`
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-[8px] border border-border-default bg-subtle-bg p-5 text-center md:flex-row md:items-start md:p-6 md:text-left">
      {author.avatarUrl ? (
        <img
          alt={author.name}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
          decoding="async"
          loading="lazy"
          src={author.avatarUrl}
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2d6e7e] text-xl font-bold text-white">
          {author.name.charAt(0)}
        </div>
      )}
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Viết bởi
        </div>
        <Link
          className="mb-2 block text-[16px] font-bold text-text-primary hover:underline"
          href={`/authors/${author.username}`}
        >
          {author.name}
        </Link>
        <div className="mb-3 text-[13px] leading-[1.6] text-text-secondary [&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0 [&_.ProseMirror]:text-center md:[&_.ProseMirror]:text-left">
          {(() => {
            if (!author.bio) {
              return <p>{fallbackBio(author.name)}</p>
            }
            if (author.bio.startsWith("{")) {
              let json: unknown = null
              try {
                json = JSON.parse(author.bio)
              } catch {}
              if (json) {
                return <StaticPostContent content={json} />
              }
            }
            return <p>{author.bio}</p>
          })()}
        </div>
        <Link
          className="text-[13px] font-medium text-accent hover:underline"
          href={`/authors/${author.username}`}
        >
          Xem tất cả bài viết -&gt;
        </Link>
      </div>
    </section>
  )
}
