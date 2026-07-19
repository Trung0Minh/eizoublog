import { Loader } from "@/components/ui/Loader"

export default function AdminLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <Loader size="md" />
      <span className="sr-only">Loading admin workspace</span>
    </div>
  )
}
