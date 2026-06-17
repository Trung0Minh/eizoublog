import { Loader } from "@/components/ui/Loader"

export default function DashboardLoading() {
  return (
    <main
      aria-live="polite"
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8"
      role="status"
    >
      <span className="sr-only">Loading dashboard</span>
      <div className="flex justify-center py-4">
        <Loader aria-hidden="true" label="Loading dashboard" />
      </div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
        </div>
        <div className="h-10 w-24 rounded-[5px] bg-muted" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="border-t py-4 first:border-t-0" key={index}>
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  )
}
