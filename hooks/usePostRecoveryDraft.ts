"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const DATABASE_NAME = "animeblog-post-recovery"
const STORE_NAME = "drafts"

interface StoredDraft<T> {
  key: string
  payload: T
  updatedAt: string
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = operation(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export function usePostRecoveryDraft<T>({
  isDirty,
  key,
  payload,
}: {
  isDirty: boolean
  key: string
  payload: T
}) {
  const [candidate, setCandidate] = useState<StoredDraft<T> | null>(null)
  const loadedKeyRef = useRef<string | null>(null)
  const payloadRef = useRef(payload)
  const previousKeyRef = useRef(key)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  useEffect(() => {
    let active = true
    void runTransaction<StoredDraft<T> | undefined>("readonly", (store) => store.get(key))
      .then((stored) => {
        if (!active) return
        loadedKeyRef.current = key
        if (
          stored &&
          JSON.stringify(stored.payload) !== JSON.stringify(payloadRef.current)
        ) {
          setCandidate(stored)
        }
      })
      .catch(() => {
        loadedKeyRef.current = key
      })
    return () => {
      active = false
    }
  }, [key])

  useEffect(() => {
    if (previousKeyRef.current === key) return
    const previousKey = previousKeyRef.current
    previousKeyRef.current = key
    void runTransaction("readwrite", (store) => store.delete(previousKey)).catch(() => undefined)
  }, [key])

  useEffect(() => {
    if (loadedKeyRef.current !== key) return
    const timeout = setTimeout(() => {
      if (isDirty) {
        const stored: StoredDraft<T> = {
          key,
          payload,
          updatedAt: new Date().toISOString(),
        }
        void runTransaction("readwrite", (store) => store.put(stored)).catch(() => undefined)
      } else {
        void runTransaction("readwrite", (store) => store.delete(key)).catch(() => undefined)
      }
    }, 750)
    return () => clearTimeout(timeout)
  }, [isDirty, key, payload])

  const discard = useCallback(() => {
    setCandidate(null)
    void runTransaction("readwrite", (store) => store.delete(key)).catch(() => undefined)
  }, [key])

  const accept = useCallback(() => {
    const recovered = candidate?.payload ?? null
    setCandidate(null)
    return recovered
  }, [candidate])

  return { accept, candidate, discard }
}
