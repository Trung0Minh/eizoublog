'use client';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-[48px] font-bold">Error</h1>
      <p>Something went wrong.</p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
