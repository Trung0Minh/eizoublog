import { PageContainer } from "@/components/layout/PageContainer"
import {
  PostListSkeleton,
  SidebarSkeleton,
} from "@/components/posts/PostListSkeleton"
import { Loader } from "@/components/ui/Loader"

export default function PublicLoading() {
  return (
    <PageContainer size="wide">
      <div className="mb-8 flex justify-center" aria-label="Loading page">
        <Loader />
      </div>
      <section className="mb-10 max-w-4xl" aria-label="Loading page">
        <div className="mb-4 h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full max-w-2xl animate-pulse rounded bg-muted sm:h-14" />
        <div className="mt-5 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
      </section>

      <div className="flex flex-col gap-8 lg:flex-row xl:gap-10">
        <section className="min-w-0 flex-1" aria-label="Loading content">
          <PostListSkeleton />
        </section>
        <SidebarSkeleton />
      </div>
    </PageContainer>
  )
}
