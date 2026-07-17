"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict"

interface UseAutosaveOptions {
  debounceMs?: number
  intervalMs?: number
  onSave: () => Promise<void>
  postId: string | null
  retryMs?: number
}

export function useAutosave({
  debounceMs = 3000,
  intervalMs = 30_000,
  onSave,
  postId,
  retryMs = 5000,
}: UseAutosaveOptions) {
  const [isDirty, setIsDirty] = useState(false)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generationRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSavingRef = useRef(false)
  const pendingRef = useRef(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedGenerationRef = useRef(0)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  const clearRetry = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
  }, [])

  const save = useCallback(async () => {
    if (!postId) return
    if (generationRef.current <= savedGenerationRef.current) return

    if (isSavingRef.current) {
      pendingRef.current = true
      return
    }

    const savingGeneration = generationRef.current
    clearRetry()
    isSavingRef.current = true
    setStatus("saving")

    try {
      await onSave()
      savedGenerationRef.current = Math.max(
        savedGenerationRef.current,
        savingGeneration,
      )
      setStatus("saved")
      setIsDirty(generationRef.current > savedGenerationRef.current)

      if (
        pendingRef.current ||
        generationRef.current > savedGenerationRef.current
      ) {
        pendingRef.current = false
        isSavingRef.current = false
        await saveRef.current?.()
        return
      }
    } catch (error) {
      const isConflict = error instanceof AutosaveConflictError
      setStatus(isConflict ? "conflict" : "error")
      setIsDirty(true)
      if (!isConflict) {
        retryRef.current = setTimeout(() => {
          void saveRef.current?.()
        }, retryMs)
      }
    } finally {
      isSavingRef.current = false
    }
  }, [clearRetry, onSave, postId, retryMs])

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const markDirty = useCallback(() => {
    generationRef.current += 1
    setIsDirty(true)
    if (isSavingRef.current) pendingRef.current = true
  }, [])

  const getGeneration = useCallback(() => generationRef.current, [])

  const markSavedThrough = useCallback((generation: number) => {
    savedGenerationRef.current = Math.max(savedGenerationRef.current, generation)
    setIsDirty(generationRef.current > savedGenerationRef.current)
  }, [])

  const scheduleDebounce = useCallback(() => {
    if (!postId) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void save()
    }, debounceMs)
  }, [debounceMs, postId, save])

  useEffect(() => {
    if (!postId) return

    intervalRef.current = setInterval(() => {
      void save()
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [intervalMs, postId, save])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      clearRetry()
    }
  }, [clearRetry])

  return {
    getGeneration,
    isDirty,
    markDirty,
    markSavedThrough,
    scheduleDebounce,
    save,
    status,
  }
}

export class AutosaveConflictError extends Error {
  constructor() {
    super("Post changed in another session. Your local copy was preserved.")
    this.name = "AutosaveConflictError"
  }
}
