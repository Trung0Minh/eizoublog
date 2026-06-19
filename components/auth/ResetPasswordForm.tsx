"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ResetPasswordFormProps {
  token: string
}

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

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/password/reset", {
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(result))
        return
      }

      setPassword("")
      setConfirmPassword("")
      setMessage("Password updated successfully. You can now log in.")
    } catch {
      setError("Unable to reset your password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">Set new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create a new Anime Blog password. This is separate from your Gmail
          password.
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
            <label className="text-sm font-medium" htmlFor="new-password">
              New site password
            </label>
            <Input
              autoComplete="new-password"
              id="new-password"
              maxLength={128}
              minLength={10}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
              className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirm-new-password">
              Confirm new site password
            </label>
            <Input
              autoComplete="new-password"
              id="confirm-new-password"
              maxLength={128}
              minLength={10}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
              className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
            />
          </div>
          <Button className="w-full rounded-full bg-accent text-white hover:bg-accent/90" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save password"}
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
