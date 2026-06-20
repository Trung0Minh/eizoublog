"use client"

import { useEffect, useState } from "react"

export function useReducedVisualEffects() {
  const [shouldReduce, setShouldReduce] = useState(true)

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setShouldReduce(coarsePointer.matches || reducedMotion.matches)

    update()
    coarsePointer.addEventListener("change", update)
    reducedMotion.addEventListener("change", update)

    return () => {
      coarsePointer.removeEventListener("change", update)
      reducedMotion.removeEventListener("change", update)
    }
  }, [])

  return shouldReduce
}
