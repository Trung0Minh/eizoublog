import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import { TableOfContents } from "@/components/posts/TableOfContents"

afterEach(() => {
  cleanup()
  document.getElementById("tracking-heading")?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("measures only the visible TOC and coalesces event bursts across live breakpoint changes", () => {
  let wide = true
  const changes = new Set<() => void>()
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return wide },
    addEventListener: (_type: string, callback: () => void) => changes.add(callback),
    removeEventListener: (_type: string, callback: () => void) => changes.delete(callback),
  }))
  let nextFrame = 0
  const frames = new Map<number, FrameRequestCallback>()
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id) })
  const target = document.createElement("h2")
  target.id = "tracking-heading"
  document.body.append(target)
  const measure = vi.spyOn(target, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 96, 800, 40))
  const headings = [{ id: target.id, level: 2, text: "Heading" }]
  const { unmount } = render(<>
    <TableOfContents headings={headings} responsive />
    <TableOfContents collapsible headings={headings} responsive />
  </>)

  expect(measure).toHaveBeenCalledTimes(1)
  act(() => {
    fireEvent.scroll(window)
    fireEvent.scroll(window)
    fireEvent.resize(window)
    fireEvent(window, new HashChangeEvent("hashchange"))
  })
  expect(frames.size).toBe(1)
  const flush = () => act(() => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(0))
  })
  flush()
  expect(measure).toHaveBeenCalledTimes(2)

  act(() => {
    wide = false
    changes.forEach((callback) => callback())
  })
  expect(measure).toHaveBeenCalledTimes(3)
  fireEvent.scroll(window)
  expect(frames.size).toBe(1)
  flush()
  expect(measure).toHaveBeenCalledTimes(4)

  fireEvent.scroll(window)
  unmount()
  expect(frames.size).toBe(0)
  expect(changes.size).toBe(0)
})
