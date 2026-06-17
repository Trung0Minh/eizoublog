import { Loader } from "@/components/ui/Loader"

interface RouteLoadingProps {
  label: string
}

export function RouteLoading({ label }: RouteLoadingProps) {
  return (
    <main
      aria-live="polite"
      className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-background"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <Loader aria-hidden="true" size="md" />
    </main>
  )
}
