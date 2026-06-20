"use client"

import { useCallback, useEffect, useState } from "react"

export const PARTICLE_EFFECTS_COOKIE = "particleEffects"
export const PARTICLE_EFFECTS_CHANGED_EVENT = "particleeffectschange"

function readParticleCookie() {
  if (typeof document === "undefined") return null

  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${PARTICLE_EFFECTS_COOKIE}=`))
    ?.split("=")[1]

  if (value === "on") return true
  if (value === "off") return false
  return null
}

function writeParticleCookie(enabled: boolean) {
  document.cookie = `${PARTICLE_EFFECTS_COOKIE}=${enabled ? "on" : "off"}; path=/; max-age=31536000; SameSite=Lax`
}

function getDefaultParticleState() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  if (reducedMotion.matches) return false

  const storedPreference = readParticleCookie()
  if (storedPreference !== null) return storedPreference

  return !window.matchMedia("(pointer: coarse)").matches
}

export function useParticleEffects() {
  const [enabled, setEnabledState] = useState(false)

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setEnabledState(getDefaultParticleState())

    update()
    coarsePointer.addEventListener("change", update)
    reducedMotion.addEventListener("change", update)
    window.addEventListener(PARTICLE_EFFECTS_CHANGED_EVENT, update)

    return () => {
      coarsePointer.removeEventListener("change", update)
      reducedMotion.removeEventListener("change", update)
      window.removeEventListener(PARTICLE_EFFECTS_CHANGED_EVENT, update)
    }
  }, [])

  const setEnabled = useCallback((nextEnabled: boolean) => {
    writeParticleCookie(nextEnabled)
    document.documentElement.setAttribute(
      "data-particles",
      nextEnabled ? "on" : "off",
    )
    setEnabledState(getDefaultParticleState())
    window.dispatchEvent(new Event(PARTICLE_EFFECTS_CHANGED_EVENT))
  }, [])

  return { enabled, setEnabled }
}
