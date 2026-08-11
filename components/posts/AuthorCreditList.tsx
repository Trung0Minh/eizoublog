import { AuthorBio } from "@/components/posts/AuthorBio"
import { cn } from "@/lib/utils"

export interface AuthorCreditAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

export function AuthorCreditList({
  authors,
  className,
}: {
  authors: AuthorCreditAuthor[]
  className?: string
}) {
  const hasOverflow = authors.length > 3

  if (authors.length === 0) return null

  return (
    <div className={cn("relative", className)}>
      <div
        aria-label="Tác giả bài viết"
        className={cn(
          "gap-4",
          authors.length === 1
            ? "block"
            : "flex overflow-x-auto pb-3 pr-12 [scroll-snap-type:x_mandatory] [scrollbar-width:thin]",
          !hasOverflow && authors.length > 1 &&
            "sm:grid sm:overflow-visible sm:pb-0 sm:pr-0",
          authors.length === 2 && "sm:grid-cols-2",
          authors.length === 3 && "sm:grid-cols-3",
        )}
        data-testid="author-credit-list"
      >
        {authors.map((author) => (
          <AuthorBio
            author={author}
            className={cn(
              "min-w-0 shrink-0 basis-[82%] snap-start sm:basis-[46%]",
              hasOverflow
                ? "lg:basis-[31%]"
                : "sm:w-auto sm:shrink sm:basis-auto",
              authors.length === 1 && "w-full basis-full",
            )}
            key={author.username}
          />
        ))}
      </div>

      {authors.length > 1 && (
        <div
          className={cn(
            "mt-1 text-right text-[11px] font-medium text-text-tertiary sm:hidden",
            hasOverflow && "sm:block",
          )}
        >
          Kéo ngang để xem thêm →
        </div>
      )}
    </div>
  )
}
