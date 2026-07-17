"use client"

import { useEffect } from "react"

export function useWarnUnsaved(hasUnsaved: boolean) {
  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved) return

      event.preventDefault()
      event.returnValue = ""
    }

    const clickHandler = (event: MouseEvent) => {
      if (!hasUnsaved || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>("a[href]")
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const destination = new URL(anchor.href, window.location.href)
      if (
        destination.origin !== window.location.origin ||
        destination.href === window.location.href
      ) return
      if (
        !window.confirm(
          "Your latest changes have not been saved. Leave the editor anyway?",
        )
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", unloadHandler)
    document.addEventListener("click", clickHandler, true)
    return () => {
      window.removeEventListener("beforeunload", unloadHandler)
      document.removeEventListener("click", clickHandler, true)
    }
  }, [hasUnsaved])
}
