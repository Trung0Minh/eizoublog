import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { cn } from "@/lib/utils"

interface AuthorBioAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

interface AuthorBioProps {
  author: AuthorBioAuthor
  className?: string
}

function fallbackBio(authorName: string) {
  return `${authorName} viết về quá trình sản xuất anime, nghệ thuật kể chuyện qua hình ảnh và kỹ thuật đằng sau hoạt hình đương đại.`
}

function getBioText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  if (node.type === "hardBreak") {
    return "\n"
  }

  const childText = node.content?.map(getBioText) ?? []

  if (node.type === "doc" || node.type === "bulletList" || node.type === "orderedList") {
    return childText.filter(Boolean).join("\n")
  }

  return childText.join("")
}

function getAuthorBioPreview(author: AuthorBioAuthor) {
  if (!author.bio) {
    return fallbackBio(author.name)
  }

  if (author.bio.startsWith("{")) {
    try {
      return (
        getBioText(JSON.parse(author.bio) as JSONContent)
          .replace(/[ \t]+/g, " ")
          .replace(/ *\n */g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim() || fallbackBio(author.name)
      )
    } catch {
      return author.bio
    }
  }

  return author.bio
}

export function AuthorBio({ author, className }: AuthorBioProps) {
  const bioPreview = getAuthorBioPreview(author)

  return (
    <section
      className={cn(
        "author-bio-card glass-card flex h-full flex-row items-start gap-3 p-4 text-left md:gap-5 md:p-6",
        className,
      )}
    >
      {author.avatarUrl ? (
        <img
          alt={author.name}
          className="!m-0 h-14 w-14 shrink-0 rounded-full object-cover !cursor-default hover:!opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-accent/50"
          decoding="async"
          loading="lazy"
          src={author.avatarUrl}
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2d6e7e] text-xl font-bold text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-accent/50">
          {author.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Viết bởi
        </div>
        <Link
          className="mb-2 inline-block text-[16px] font-bold text-text-primary hover:underline"
          href={`/authors/${author.username}`}
        >
          {author.name}
        </Link>
        <div className="mb-3 line-clamp-4 whitespace-pre-line text-[13px] leading-[1.6] text-text-secondary">
          {bioPreview}
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
