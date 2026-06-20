export function SkeletonCard() {
  return (
    <div className="flex flex-col bg-subtle-bg/30 p-4 border-[2px] border-transparent rounded-[16px] animate-pulse">
      <div className="mb-4 block overflow-hidden rounded-[8px]">
        <div className="relative w-full aspect-video isolate bg-subtle-bg/80 rounded-[8px] overflow-hidden" />
      </div>

      <div className="mb-3 h-[11px] w-24 bg-subtle-bg/80 rounded" />
      
      <div className="mb-4 space-y-2">
        <div className="h-6 w-full bg-subtle-bg/80 rounded" />
        <div className="h-6 w-3/4 bg-subtle-bg/80 rounded" />
      </div>

      <div className="mt-2 space-y-2 hidden md:block">
        <div className="h-4 w-full bg-subtle-bg/80 rounded" />
        <div className="h-4 w-5/6 bg-subtle-bg/80 rounded" />
        <div className="h-4 w-4/6 bg-subtle-bg/80 rounded" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-subtle-bg/80" />
          <div className="h-4 w-24 bg-subtle-bg/80 rounded" />
        </div>
        <div className="h-3 w-16 bg-subtle-bg/80 rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 bg-subtle-bg/80 rounded-full" />
        <div className="h-6 w-20 bg-subtle-bg/80 rounded-full" />
      </div>
    </div>
  )
}
