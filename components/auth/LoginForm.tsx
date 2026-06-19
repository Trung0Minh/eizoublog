"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const authErrorMessage =
    error === "CredentialsSignin"
      ? "Invalid email or site password."
      : "This account cannot sign in. Contact an admin if you need access."

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setFormError("Invalid email or site password.")
        return
      }

      router.push(result?.url ?? callbackUrl)
    } catch {
      setFormError("Unable to log in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPanel>
      <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">Writer login</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Enter your invited account email and site password. This is not your
        Gmail password.
      </p>

      {(error === "invite-invalid" || formError) && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {formError || "This invite link is invalid or has expired."}
        </p>
      )}

      {error && error !== "invite-invalid" && !formError && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {authErrorMessage}
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
            className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="password">
              Site password
            </label>
            <Link
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            autoComplete="current-password"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
            className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
          />
        </div>
        <Button className="w-full rounded-full bg-accent text-white hover:bg-accent/90" disabled={loading} type="submit">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthPanel>
  )
}

function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 sm:p-8">
        {children}
      </section>
    </main>
  )
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
