import "@testing-library/jest-dom/vitest"

import React from "react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

import { server } from "./mocks/server"

type MotionElementProps = React.HTMLAttributes<HTMLElement> & {
  animate?: unknown
  exit?: unknown
  initial?: unknown
  transition?: unknown
  variants?: unknown
  viewport?: unknown
  whileHover?: unknown
  whileInView?: unknown
  whileTap?: unknown
}

// Mock Google Fonts
vi.mock("next/font/google", () => ({
  Nunito: () => ({ variable: "--font-inter" }),
  M_PLUS_Rounded_1c: () => ({ variable: "--font-display" }),
  Inter: () => ({ variable: "--font-inter" }),
  Lora: () => ({ variable: "--font-lora" }),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
    (...args: Args) =>
      fn(...args),
}))
vi.mock("motion/react", () => {
  const componentCache: Record<
    string,
    React.ForwardRefExoticComponent<
      MotionElementProps & React.RefAttributes<HTMLElement>
    >
  > = {}
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop !== "string") return undefined
      if (!componentCache[prop]) {
        const MotionComponent = React.forwardRef<HTMLElement, MotionElementProps>(
          ({ children, ...props }, ref) => {
          const htmlProps = { ...props }
          delete htmlProps.animate
          delete htmlProps.exit
          delete htmlProps.initial
          delete htmlProps.transition
          delete htmlProps.variants
          delete htmlProps.viewport
          delete htmlProps.whileHover
          delete htmlProps.whileInView
          delete htmlProps.whileTap
          return React.createElement(prop, { ref, ...htmlProps }, children)
        })
        MotionComponent.displayName = `Motion.${prop}`
        componentCache[prop] = MotionComponent
      }
      return componentCache[prop]
    }
  })
  const dummyMotionValue = {
    get: () => 0,
    set: () => {},
    onChange: () => () => {},
    on: () => () => {},
    destroy: () => {},
  }
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useScroll: () => ({
      scrollY: dummyMotionValue,
      scrollYProgress: dummyMotionValue,
    }),
    useTransform: () => dummyMotionValue,
    useSpring: () => dummyMotionValue,
    useMotionValue: (initial: unknown) => ({
      ...dummyMotionValue,
      get: () => initial,
    }),
  }
})

// Mock Browser APIs not present in JSDOM
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
})

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
