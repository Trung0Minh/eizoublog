"use client"

import { signIn } from "next-auth/react"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InviteFormProps {
  token: string
  email: string
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

export function InviteForm({ token, email }: InviteFormProps) {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, username, password }),
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(result))
        return
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: true,
      })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invite-email">
          Email
        </label>
        <Input
          className="bg-muted/50 text-muted-foreground rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
          disabled
          id="invite-email"
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="display-name">
          Display Name
        </label>
        <Input
          autoComplete="name"
          id="display-name"
          maxLength={50}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name or pen name"
          required
          value={name}
          className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="username">
          Username
        </label>
        <p className="text-xs text-muted-foreground">
          Used in your public profile URL: /authors/[username]
        </p>
        <Input
          autoCapitalize="none"
          autoComplete="username"
          id="username"
          maxLength={30}
          minLength={3}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          pattern="^[a-z0-9_-]+$"
          placeholder="e.g. sakuga_fan"
          required
          value={username}
          className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invite-password">
          Site password
        </label>
        <p className="text-xs text-muted-foreground">
          Create a separate Anime Blog password. Do not use your Gmail password.
        </p>
        <Input
          autoComplete="new-password"
          id="invite-password"
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
        <label
          className="text-sm font-medium"
          htmlFor="invite-confirm-password"
        >
          Confirm site password
        </label>
        <Input
          autoComplete="new-password"
          id="invite-confirm-password"
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
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
