"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/password/forgot", {
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(result))
        return
      }

      setMessage(
        "If this email belongs to an invited writer, a reset link has been sent."
      )
    } catch {
      setError("Unable to request a reset link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">Forgot password</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enter your invited writer email. If it belongs to an active account,
          we will send a link to set a new Anime Blog password.
        </p>

        {message && (
          <p className="mt-6 text-sm text-green-700 dark:text-green-400" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-6 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reset-email">
              Email
            </label>
            <Input
              autoComplete="email"
              id="reset-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
              className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
            />
          </div>
          <Button className="w-full rounded-full bg-accent text-white hover:bg-accent/90" disabled={loading} type="submit">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <Link
          className="mt-5 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href="/login"
        >
          Back to login
        </Link>
      </section>
    </main>
  )
}
