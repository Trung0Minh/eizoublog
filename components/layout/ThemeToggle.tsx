"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore, useRef } from "react"
import { flushSync } from "react-dom"

import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => undefined

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  if (!mounted) {
    return <div aria-hidden="true" className="h-8 w-8" />
  }

  const activeTheme = resolvedTheme ?? theme
  const isDark = activeTheme === "dark"

  const handleToggle = async () => {
    const nextTheme = isDark ? "light" : "dark"

    if (
      !buttonRef.current ||
      !document.startViewTransition ||
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setTheme(nextTheme)
      return
    }

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 750,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })
  }

  return (
    <Button
      ref={buttonRef}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="h-8 w-8 rounded-full text-text-secondary hover:bg-subtle-bg hover:text-text-primary [&_svg]:h-[18px] [&_svg]:w-[18px]"
      onClick={handleToggle}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}

