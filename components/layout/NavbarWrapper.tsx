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
  const isIdleRef = useRef(false)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetIdle = () => {
    if (isIdleRef.current) {
      isIdleRef.current = false
      setIsIdle(false)
    }
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    idleTimeoutRef.current = setTimeout(() => {
      // only auto-hide if on mobile, not at top, and menu is closed
      if (isMobileRef.current && !isMenuOpenRef.current && window.scrollY > 50) {
        isIdleRef.current = true
        setIsIdle(true)
      }
    }, 3000)
  }

  useEffect(() => {

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // For desktop homepage
      const nextIsScrolled = currentScrollY > 300
      if (isScrolledRef.current !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled
        setIsScrolled(nextIsScrolled)
      }

      // For smart scroll (hide on scroll down)
      if (currentScrollY > lastScrollYRef.current + 10 && currentScrollY > 50) {
        setIsScrollingDown(true)
      } else if (currentScrollY < lastScrollYRef.current - 10 || currentScrollY < 50) {
        setIsScrollingDown(false)
      }
      
      lastScrollYRef.current = currentScrollY
      resetIdle()
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
          if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
          isIdleRef.current = false
          setIsIdle(false)
        } else {
          resetIdle()
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
        resetIdle()
      } else {
        // if visible, hide it immediately
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        if (!isMenuOpenRef.current && window.scrollY > 50) {
          isIdleRef.current = true
          setIsIdle(true)
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)
    window.addEventListener("navbar-menu:open-change", handleMenuOpenChange)
    window.addEventListener("click", handleTap)
    window.addEventListener("touchstart", handleTap, { passive: true })
    const timer = setTimeout(handleResize, 0)
    handleScroll() // initial check

    return () => {
      clearTimeout(timer)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("navbar-menu:open-change", handleMenuOpenChange)
      window.removeEventListener("click", handleTap)
      window.removeEventListener("touchstart", handleTap)
    }
  }, [])

  const isEditorRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")
  
  if (isEditorRoute) {
    return null
  }
  
  // On mobile: show if at top, scrolling up, hovering top, or menu is open. Hide if idle.
  // On desktop: show if NOT home, scrolled past 300px, hovering top, or menu is open
  const showNavbar = isMobile
    ? (!isScrollingDown && !isIdle) || isMenuOpen || isHoveringTop
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
