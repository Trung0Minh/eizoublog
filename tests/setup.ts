import "@testing-library/jest-dom/vitest"

import { afterAll, afterEach, beforeAll, vi } from "vitest"

import { server } from "./mocks/server"

// Mock Google Fonts
vi.mock("next/font/google", () => ({
  Nunito: () => ({ variable: "--font-inter" }),
  M_PLUS_Rounded_1c: () => ({ variable: "--font-display" }),
  Inter: () => ({ variable: "--font-inter" }),
  Lora: () => ({ variable: "--font-lora" }),
}))
vi.mock("motion/react", () => {
  const React = require("react")
  const componentCache: Record<string, any> = {}
  const motionProxy = new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop !== "string") return undefined
      if (!componentCache[prop]) {
        componentCache[prop] = React.forwardRef(({ children, ...props }: any, ref: any) => {
          const {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            viewport,
            whileInView,
            ...htmlProps
          } = props
          return React.createElement(prop, { ref, ...htmlProps }, children)
        })
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
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useScroll: () => ({
      scrollY: dummyMotionValue,
      scrollYProgress: dummyMotionValue,
    }),
    useTransform: () => dummyMotionValue,
    useSpring: () => dummyMotionValue,
    useMotionValue: (initial: any) => ({
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

