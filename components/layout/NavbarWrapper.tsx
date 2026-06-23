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
  const isScrolledRef = useRef(false)
  const isHoveringTopRef = useRef(false)
  const isMobileRef = useRef(false)
  const isMenuOpenRef = useRef(false)

  useEffect(() => {
    if (!isHome) return

    const handleScroll = () => {
      // Show navbar after scrolling down 300px
      const nextIsScrolled = window.scrollY > 300
      if (isScrolledRef.current !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled
        setIsScrolled(nextIsScrolled)
      }
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
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)
    window.addEventListener("navbar-menu:open-change", handleMenuOpenChange)
    const timer = setTimeout(handleResize, 0)
    handleScroll() // initial check

    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("navbar-menu:open-change", handleMenuOpenChange)
    }
  }, [isHome])

  const isEditorRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")
  
  if (isEditorRoute) {
    return null
  }
  
  // Show navbar if we are NOT on the homepage, or if scrolled, or if hovering top, or if on mobile
  const showNavbar = !isHome || isScrolled || isHoveringTop || isMobile || isMenuOpen

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
