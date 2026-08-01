"use client"

import { Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

function isDecisionResponse(value: unknown): value is { data: { status: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "status" in value.data &&
    typeof value.data.status === "string"
  )
}

export function PostReviewActions({
  requestId,
}: {
  requestId: string
}) {
  const router = useRouter()
  const [declining, setDeclining] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState("")

  async function decide(action: "accept" | "decline") {
    setError("")
    const response = await fetch(
      `/api/admin/post-review-requests/${requestId}/${action}`,
      {
        body:
          action === "decline"
            ? JSON.stringify({ reason: reason.trim() })
            : undefined,
        headers:
          action === "decline"
            ? { "Content-Type": "application/json" }
            : undefined,
        method: "POST",
      },
    )
    const result: unknown = await response.json()

    if (!response.ok) {
      throw new Error(getApiError(result))
    }

    if (!isDecisionResponse(result)) {
      throw new Error("Invalid review response")
    }

    router.refresh()
    window.dispatchEvent(new Event("notifications:changed"))
  }

  function submit(action: "accept" | "decline") {
    startTransition(() => {
      void decide(action).catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong",
        )
      })
    })
  }

  return (
    <section className="mb-6 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-4 text-text-primary shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
            Review requested
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Accept to apply this update, or decline with a reason for the writer.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            disabled={isPending}
            onClick={() => submit("accept")}
            type="button"
          >
            <Check aria-hidden="true" className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button
            disabled={isPending}
            onClick={() => setDeclining((value) => !value)}
            type="button"
            variant="outline"
          >
            <X aria-hidden="true" className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </div>
      {declining && (
        <div className="mt-4 space-y-3">
          <label
            className="block text-sm font-semibold text-text-primary"
            htmlFor="review-decline-reason"
          >
            Reason
          </label>
          <textarea
            className="min-h-28 w-full rounded-[8px] border border-border-default bg-background px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
            id="review-decline-reason"
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the writer what needs to change."
            value={reason}
          />
          <Button
            disabled={isPending || reason.trim().length < 3}
            onClick={() => submit("decline")}
            type="button"
            variant="destructive"
          >
            Send decline
          </Button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  )
}
