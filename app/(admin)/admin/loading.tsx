import { Loader } from "@/components/ui/Loader"

export default function AdminLoading() {
  return (
    <div aria-live="polite" className="space-y-8" role="status">
      <span className="sr-only">Loading admin panel</span>
      <div className="flex justify-center py-4">
        <Loader aria-hidden="true" label="Loading admin panel" />
      </div>
      <section className="rounded-[8px] border bg-background p-5 sm:p-6">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-4 h-8 w-72 max-w-full rounded bg-muted" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-muted" />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="rounded-[8px] border bg-background p-4" key={index}>
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-4 h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </section>
      <section className="rounded-[8px] border bg-background p-5 sm:p-6">
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="rounded-[8px] border p-4" key={index}>
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-4 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
