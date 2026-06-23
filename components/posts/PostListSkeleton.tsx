export function PostListSkeleton() {
  return (
    <div className="space-y-10 md:space-y-14" aria-label="Loading posts">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          className="space-y-4"
          data-testid="post-card-skeleton"
          key={index}
        >
          <div className="aspect-video w-full animate-shimmer rounded-[6px]" />
          <div className="space-y-3">
            <div className="h-3 w-24 animate-shimmer rounded" />
            <div className="h-6 w-3/4 animate-shimmer rounded" />
            <div className="hidden space-y-2 sm:block">
              <div className="h-4 w-full animate-shimmer rounded" />
              <div className="h-4 w-2/3 animate-shimmer rounded" />
            </div>
            <div className="h-4 w-40 animate-shimmer rounded" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <aside
      aria-label="Loading sidebar"
      className="w-full shrink-0 space-y-12 lg:w-[240px]"
    >
      <div className="h-32 animate-shimmer rounded-[8px] border border-border-default" />
      <div className="space-y-3">
        <div className="h-4 w-28 animate-shimmer rounded" />
        <div className="h-28 animate-shimmer rounded-[8px] border border-border-default" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 animate-shimmer rounded" />
        <div className="h-24 animate-shimmer rounded-[8px] border border-border-default" />
      </div>
    </aside>
  )
}
