"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutosaveOptions {
  debounceMs?: number
  intervalMs?: number
  isDirty?: boolean
  onSave: () => Promise<void>
  postId: string | null
  retryMs?: number
}

export function useAutosave({
  debounceMs = 3000,
  intervalMs = 30_000,
  isDirty = true,
  onSave,
  postId,
  retryMs = 5000,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSavingRef = useRef(false)
  const pendingRef = useRef(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  const clearRetry = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
  }, [])

  const save = useCallback(async () => {
    if (!postId) return
    if (!isDirtyRef.current) return

    if (isSavingRef.current) {
      pendingRef.current = true
      return
    }

    clearRetry()
    isSavingRef.current = true
    setStatus("saving")

    try {
      await onSave()
      setStatus("saved")

      if (pendingRef.current) {
        pendingRef.current = false
        isSavingRef.current = false
        await saveRef.current?.()
        return
      }
    } catch {
      setStatus("error")
      retryRef.current = setTimeout(() => {
        void saveRef.current?.()
      }, retryMs)
    } finally {
      isSavingRef.current = false
    }
  }, [clearRetry, onSave, postId, retryMs])

  useEffect(() => {
    saveRef.current = save
  }, [save])

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

  return { scheduleDebounce, save, status }
}
