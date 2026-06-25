"use client"

import { useEffect, useState } from "react"
import { useRef } from "react"
import { motion, useSpring, useMotionTemplate } from "motion/react"
import { useReducedVisualEffects } from "@/hooks/useReducedVisualEffects"

export function CursorSpotlight() {
  const shouldReduce = useReducedVisualEffects()
  const [isVisible, setIsVisible] = useState(false)
  const isVisibleRef = useRef(false)

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 }
  const cursorX = useSpring(0, springConfig)
  const cursorY = useSpring(0, springConfig)

  useEffect(() => {
    if (shouldReduce) return
    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!isVisibleRef.current) {
        isVisibleRef.current = true
        setIsVisible(true)
      }
    }

    const handleMouseLeave = () => {
      isVisibleRef.current = false
      setIsVisible(false)
    }
    const handleMouseEnter = () => {
      isVisibleRef.current = true
      setIsVisible(true)
    }

    window.addEventListener("mousemove", updateMousePosition)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [cursorX, cursorY])

  const background = useMotionTemplate`radial-gradient(600px circle at ${cursorX}px ${cursorY}px, rgba(255,255,255,0.06), transparent 40%)`

  if (shouldReduce) return null

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        background,
      }}
    />
  )
}
