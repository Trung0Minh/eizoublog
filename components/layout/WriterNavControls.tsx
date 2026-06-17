"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { MobileNav } from "@/components/layout/MobileNav"
import {
  WriterMenu,
  type WriterMenuUser,
} from "@/components/layout/WriterMenu"
import { loadSessionUser } from "@/lib/clientSession"

interface WriterNavControlsProps {
  links: { href: string; label: string }[]
  user?: WriterMenuUser | null
}

const SESSION_LOAD_DELAY_MS = 300

function scheduleSessionLoad(callback: () => void) {
  const timeoutId = window.setTimeout(callback, SESSION_LOAD_DELAY_MS)

  return () => window.clearTimeout(timeoutId)
}

export function WriterNavControls({ links, user }: WriterNavControlsProps) {
  const pathname = usePathname()
  const [loadedUser, setLoadedUser] = useState<WriterMenuUser | null>(null)

  useEffect(() => {
    if (user !== undefined) return

    let isMounted = true

    async function loadSession() {
      try {
        const sessionUser = await loadSessionUser()
        if (isMounted) {
          setLoadedUser(sessionUser)
        }
      } catch {
        if (isMounted) {
          setLoadedUser(null)
        }
      }
    }

    const cancelSessionLoad = scheduleSessionLoad(() => {
      void loadSession()
    })

    return () => {
      isMounted = false
      cancelSessionLoad()
    }
  }, [pathname, user])

  const menuUser = user !== undefined ? user : loadedUser

  return (
    <>
      <div className="hidden md:block" data-testid="desktop-writer-menu">
        <WriterMenu user={menuUser} />
      </div>
      <MobileNav links={links} user={menuUser} />
    </>
  )
}
