"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { FileJson, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const maxClientBackupBytes = 6 * 1024 * 1024

interface ImportTarget {
  id: string
  status: "DRAFT" | "PUBLISHED"
  title: string
  version: number
}

interface PostBackupImportProps {
  currentPost?: ImportTarget
  rail?: boolean
}

function getError(value: unknown) {
  return typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
    ? value.error
    : "Could not import this backup"
}

function readTargets(value: unknown): ImportTarget[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("posts" in value.data) ||
    !Array.isArray(value.data.posts)
  ) return []

  return value.data.posts.flatMap((post) =>
    typeof post === "object" &&
    post !== null &&
    "id" in post &&
    "status" in post &&
    "title" in post &&
    "version" in post &&
    typeof post.id === "string" &&
    (post.status === "DRAFT" || post.status === "PUBLISHED") &&
    typeof post.title === "string" &&
    typeof post.version === "number"
      ? [{ id: post.id, status: post.status, title: post.title, version: post.version }]
      : [],
  )
}

function readImportResult(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("post" in value.data) ||
    typeof value.data.post !== "object" ||
    value.data.post === null ||
    !("id" in value.data.post) ||
    typeof value.data.post.id !== "string"
  ) return null

  const warnings =
    "warnings" in value.data && Array.isArray(value.data.warnings)
      ? value.data.warnings.filter((warning): warning is string => typeof warning === "string")
      : []
  return { id: value.data.post.id, warnings }
}

function readBackupTitle(value: unknown) {
  if (
    typeof value === "object" && value !== null && "data" in value &&
    typeof value.data === "object" && value.data !== null &&
    "formatVersion" in value.data && value.data.formatVersion === 1 &&
    "post" in value.data && typeof value.data.post === "object" && value.data.post !== null &&
    "content" in value.data.post
  ) {
    return "title" in value.data.post && typeof value.data.post.title === "string"
      ? value.data.post.title.trim() || "Untitled backup"
      : "Untitled backup"
  }
  return null
}

export function PostBackupImport({ currentPost, rail = false }: PostBackupImportProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<unknown>(null)
  const [backupTitle, setBackupTitle] = useState("")
  const [fileName, setFileName] = useState("")
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState("")
  const [targets, setTargets] = useState<ImportTarget[]>([])

  const selectedTarget = targets.find(({ id }) => id === selectedTargetId)

  async function chooseFile(file: File | undefined) {
    if (!file) return
    if (file.size > maxClientBackupBytes) {
      toast.error("Backup file is too large")
      return
    }
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const title = readBackupTitle(parsed)
      if (!title) throw new Error("This is not a supported post backup")
      setBackup(parsed)
      setBackupTitle(title)
      setFileName(file.name)
      if (currentPost) {
        setTargets([currentPost])
        setSelectedTargetId(currentPost.id)
        setConfirmOpen(true)
        return
      }

      const response = await fetch("/api/posts/import")
      const result: unknown = await response.json()
      if (!response.ok) throw new Error(getError(result))
      const availableTargets = readTargets(result)
      setTargets(availableTargets)
      setSelectedTargetId(availableTargets[0]?.id ?? "")
      setOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read this backup")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function runImport(mode: "CREATE_DRAFT" | "OVERWRITE") {
    if (!backup || (mode === "OVERWRITE" && !selectedTarget)) return
    setPending(true)
    try {
      const response = await fetch("/api/posts/import", {
        body: JSON.stringify(
          mode === "CREATE_DRAFT"
            ? { backup, mode }
            : {
                backup,
                baseVersion: selectedTarget?.version,
                mode,
                targetPostId: selectedTarget?.id,
              },
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const value: unknown = await response.json()
      if (!response.ok) throw new Error(getError(value))
      const result = readImportResult(value)
      if (!result) throw new Error("The server returned an invalid import result")
      setOpen(false)
      setConfirmOpen(false)
      toast.success(mode === "CREATE_DRAFT" ? "Backup imported as a new draft" : "Post replaced from backup")
      result.warnings.forEach((warning) => toast.warning(warning))
      const editHref = `/dashboard/edit/${result.id}`
      if (currentPost?.id === result.id) {
        window.location.assign(editHref)
      } else {
        router.push(editHref)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import this backup")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => void chooseFile(event.target.files?.[0])}
        type="file"
      />
      <Button
        aria-label={currentPost ? "Import backup into this post" : "Import post backup"}
        className={
          rail
            ? "h-9 w-9 rounded-full border border-border-default/60 bg-background/45 p-0 text-text-secondary shadow-sm backdrop-blur-md hover:border-accent/35 hover:bg-subtle-bg hover:text-text-primary"
            : "h-10 w-10 rounded-full p-0"
        }
        onClick={() => inputRef.current?.click()}
        size="icon"
        title={currentPost ? "Import backup into this post" : "Import post backup"}
        type="button"
        variant={rail ? "ghost" : "outline"}
      >
        <Upload aria-hidden="true" className="h-4 w-4" />
      </Button>

      <Dialog.Root onOpenChange={setOpen} open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-border-default/70 bg-background/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-7">
            <Dialog.Close aria-label="Close dialog" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-subtle-bg hover:text-text-primary">
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
              <FileJson aria-hidden="true" className="h-5 w-5" />
            </div>
            <Dialog.Title className="pr-8 font-display text-xl font-bold text-text-primary">Import post backup</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
              Restore the safe writing fields from <span className="font-medium text-text-primary">{fileName}</span>. Authors, co-authors, publication state, and history are never imported.
            </Dialog.Description>

            <div className="mt-5 rounded-[12px] border border-border-default/60 bg-subtle-bg/65 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Backup title</p>
              <p className="mt-1 truncate font-medium text-text-primary">{backupTitle}</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="rounded-[14px] border border-accent/35 bg-accent/5 p-4 text-left transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={pending} onClick={() => void runImport("CREATE_DRAFT")} type="button">
                <span className="font-semibold text-text-primary">Create new draft</span>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">Keeps every existing post untouched.</span>
              </button>
              <div className="rounded-[14px] border border-border-default/70 p-4">
                <p className="font-semibold text-text-primary">Replace a post</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">Creates a safety version first, then returns it to draft.</p>
                <Select onValueChange={setSelectedTargetId} value={selectedTargetId}>
                  <SelectTrigger className="mt-3" aria-label="Post to replace">
                    <SelectValue placeholder="Choose a post" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.id} value={target.id}>{target.title} · {target.status === "PUBLISHED" ? "Published" : "Draft"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="mt-3 w-full" disabled={!selectedTarget || pending} onClick={() => { setOpen(false); setConfirmOpen(true) }} type="button" variant="outline">
                  Continue
                </Button>
              </div>
            </div>
            {pending && <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary"><Loader2 className="h-4 w-4 animate-spin" /> Importing backup…</div>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmationDialog
        cancelLabel="Go back"
        confirmLabel="Replace and return to draft"
        description={
          <>
            This replaces the editable content of <strong>{selectedTarget?.title}</strong>
            {currentPost && backupTitle ? <> with <strong>{backupTitle}</strong></> : null}.
            Its current saved state is preserved permanently in post history first.
          </>
        }
        onConfirm={() => void runImport("OVERWRITE")}
        onOpenChange={(nextOpen) => {
          setConfirmOpen(nextOpen)
          if (!nextOpen && !pending && !currentPost) setOpen(true)
        }}
        open={confirmOpen}
        pending={pending}
        title="Replace this post from backup?"
        tone="warning"
      />
    </>
  )
}
