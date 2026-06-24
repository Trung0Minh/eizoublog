"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHoveringTop, setIsHoveringTop] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const isScrolledRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const isHoveringTopRef = useRef(false)
  const isMobileRef = useRef(false)
  const isMenuOpenRef = useRef(false)
  const isScrollingDownRef = useRef(false)
  const isIdleRef = useRef(false)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleDeadlineRef = useRef(0)
  const scrollFrameRef = useRef<number | null>(null)
  const keepVisibleUntilRef = useRef(0)

  useEffect(() => {
    const setIdleState = (nextIdle: boolean) => {
      if (isIdleRef.current !== nextIdle) {
        isIdleRef.current = nextIdle
        setIsIdle(nextIdle)
      }
    }

    const setScrollingDownState = (nextScrollingDown: boolean) => {
      if (isScrollingDownRef.current !== nextScrollingDown) {
        isScrollingDownRef.current = nextScrollingDown
        setIsScrollingDown(nextScrollingDown)
      }
    }

    const scheduleIdleCheck = (delay = 3000) => {
      idleDeadlineRef.current = Date.now() + delay
      if (idleTimeoutRef.current) return

      const checkIdle = () => {
        const remaining = idleDeadlineRef.current - Date.now()
        if (remaining > 0) {
          idleTimeoutRef.current = setTimeout(checkIdle, remaining)
          return
        }

        idleTimeoutRef.current = null
        if (isMobileRef.current && !isMenuOpenRef.current) {
          setIdleState(true)
        }
      }

      idleTimeoutRef.current = setTimeout(checkIdle, delay)
    }

    const markActive = (delay = 3000) => {
      setIdleState(false)
      scheduleIdleCheck(delay)
    }

    const updateScrollState = () => {
      const currentScrollY = window.scrollY
      
      // For desktop homepage
      const nextIsScrolled = currentScrollY > 300
      if (isScrolledRef.current !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled
        setIsScrolled(nextIsScrolled)
      }

      // For smart scroll (hide on scroll down)
      if (Date.now() < keepVisibleUntilRef.current) {
        setScrollingDownState(false)
      } else if (currentScrollY > lastScrollYRef.current + 10 && currentScrollY > 50) {
        setScrollingDownState(true)
      } else if (currentScrollY < lastScrollYRef.current - 10 || currentScrollY < 50) {
        setScrollingDownState(false)
      }
      
      lastScrollYRef.current = currentScrollY
      if (isMobileRef.current) markActive()
    }

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return

      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null
        updateScrollState()
      })
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      // Show navbar if mouse is within top 100px
      const nextIsHoveringTop = e.clientY < 100
      if (isHoveringTopRef.current !== nextIsHoveringTop) {
        isHoveringTopRef.current = nextIsHoveringTop
        setIsHoveringTop(nextIsHoveringTop)
      }
    }

    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768
      if (isMobileRef.current !== nextIsMobile) {
        isMobileRef.current = nextIsMobile
        setIsMobile(nextIsMobile)
      }
    }

    const handleMenuOpenChange = (event: Event) => {
      const nextIsMenuOpen =
        event instanceof CustomEvent && event.detail === true
      if (isMenuOpenRef.current !== nextIsMenuOpen) {
        isMenuOpenRef.current = nextIsMenuOpen
        setIsMenuOpen(nextIsMenuOpen)
        if (nextIsMenuOpen) {
          keepVisibleUntilRef.current = 0
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current)
            idleTimeoutRef.current = null
          }
          setIdleState(false)
        } else {
          keepVisibleUntilRef.current = Date.now() + 3000
          setScrollingDownState(false)
          markActive()
        }
      }
    }

    const handleTap = (e: MouseEvent | TouchEvent) => {
      if (!isMobileRef.current) return
      
      const target = e.target as HTMLElement
      // ignore if clicking interactive elements or inside the navbar itself
      if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('.sticky')) return

      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) return

      if (isIdleRef.current) {
        // if hidden, show it and reset timer
        markActive()
      } else {
        // if visible, hide it immediately
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        if (!isMenuOpenRef.current) {
          keepVisibleUntilRef.current = 0
          setIdleState(true)
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)
    window.addEventListener("navbar-menu:open-change", handleMenuOpenChange)
    window.addEventListener("click", handleTap)
    handleResize()
    updateScrollState() // initial check

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current)
      }
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("navbar-menu:open-change", handleMenuOpenChange)
      window.removeEventListener("click", handleTap)
    }
  }, [])

  const isEditorRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")
  
  if (isEditorRoute) {
    return null
  }
  
  // On mobile: show while active or when a menu is open. Desktop keeps hover-to-show.
  // On desktop: show if NOT home, scrolled past 300px, hovering top, or menu is open
  const showNavbar = isMobile
    ? ((!isScrollingDown && !isIdle) || isMenuOpen)
    : (!isHome || isScrolled || isHoveringTop || isMenuOpen)

  return (
    <div 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      {children}
    </div>
  )
}
