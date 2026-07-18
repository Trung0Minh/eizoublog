"use client"

import type { JSONContent } from "@tiptap/react"
import { Check, ChevronLeft, Eye, Pencil, Save } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EventArticleEditorProps {
  event: {
    id: string
    status: string
    title: string
    finalPost: {
      content: JSONContent
      contentText: string | null
      id: string
      slug: string
      version: number
    }
    rooms: Array<{
      id: string
      order: number
      selectedPost: { title: string } | null
      writer: { name: string; username: string }
    }>
  }
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

  return "Unable to save the merged article"
}

export function EventArticleEditor({ event }: EventArticleEditorProps) {
  const [content, setContent] = useState(event.finalPost.content)
  const [contentText, setContentText] = useState(event.finalPost.contentText ?? "")
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [version, setVersion] = useState(event.finalPost.version)

  function jumpToSection(roomId: string) {
    document
      .querySelector(`[data-editor-content] #event-room-${roomId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  async function saveArticle() {
    setError("")
    setIsPending(true)
    setIsSaved(false)

    try {
      const response = await fetch(`/api/posts/${event.finalPost.id}`, {
        body: JSON.stringify({
          baseVersion: version,
          content,
          contentText,
          saveKind: "MANUAL",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      if (
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data !== null &&
        "version" in result.data &&
        typeof result.data.version === "number"
      ) {
        setVersion(result.data.version)
      }
      setIsSaved(true)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save the merged article")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background pb-16">
      <header className="border-b border-border-default/70 bg-subtle-bg/45">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="min-w-0">
            <Link
              className="mb-3 inline-flex items-center text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
              href={`/admin/events/${event.id}`}
            >
              <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
              Back to event
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Pencil aria-hidden="true" className="h-5 w-5 text-accent" />
              <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {event.title}
              </h1>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                Merged article
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Edit the assembled event article without changing any contributor submission.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/${event.finalPost.slug}`} target="_blank">
                <Eye aria-hidden="true" className="mr-2 h-4 w-4" />
                View published
              </Link>
            </Button>
            <Button
              className="rounded-full bg-accent px-5 font-semibold text-white hover:bg-accent/90"
              disabled={isPending}
              onClick={() => void saveArticle()}
              type="button"
            >
              {isSaved ? (
                <Check aria-hidden="true" className="mr-2 h-4 w-4" />
              ) : (
                <Save aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              {isPending ? "Saving..." : isSaved ? "Saved" : "Save merged article"}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-5 w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive" role="alert">
            {error}
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_240px] lg:px-10">
        <aside className="h-fit rounded-2xl border border-border-default/70 bg-subtle-bg/35 p-4 lg:sticky lg:top-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
            Contributors
          </p>
          <nav aria-label="Merged article sections" className="space-y-1">
            {event.rooms
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((room) => (
                <button
                  className="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  key={room.id}
                  onClick={() => jumpToSection(room.id)}
                  type="button"
                >
                  <span className="block truncate text-sm font-semibold text-text-primary">
                    {room.writer.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-text-tertiary">
                    {room.selectedPost?.title ?? "No source post"}
                  </span>
                </button>
              ))}
          </nav>
        </aside>

        <section className="min-w-0 rounded-[24px] border border-border-default/80 bg-subtle-bg/25 p-4 shadow-[0_18px_60px_rgba(31,24,38,0.08)] sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-default/70 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Editorial canvas
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Changes here affect only the merged event article.
              </p>
            </div>
            <span className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              isSaved
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border-default bg-background text-text-tertiary",
            )}>
              {isSaved ? "All changes saved" : `Version ${version}`}
            </span>
          </div>
          <div data-editor-content>
            <TiptapEditor
              ariaLabel="Merged event article editor"
              content={content}
              mode="default"
              onChange={(nextContent, nextText) => {
                setContent(nextContent)
                setContentText(nextText)
                setIsSaved(false)
              }}
              placeholder="Edit the merged event article..."
            />
          </div>
        </section>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-accent/25 bg-accent/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Editorial boundary
            </p>
            <p className="mt-3 text-sm leading-6 text-text-primary">
              Your edits are stored on the merged article only. Contributor source posts stay unchanged.
            </p>
          </section>
          <section className="rounded-2xl border border-border-default/70 bg-subtle-bg/35 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              Event status
            </p>
            <p className="mt-2 text-lg font-bold text-text-primary">{event.status}</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              The public page uses this merged article as its event content.
            </p>
          </section>
        </aside>
      </div>
    </main>
  )
}
