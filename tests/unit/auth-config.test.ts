import type { NextAuthConfig } from "next-auth"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  credentialsProvider: vi.fn((options: unknown) => ({
    id: "credentials",
    options,
  })),
  nextAuth: vi.fn((config: unknown) => ({
    auth: "auth",
    handlers: "handlers",
    signIn: "signIn",
    signOut: "signOut",
    config,
  })),
  prismaAdapter: vi.fn(() => ({ name: "prisma-adapter" })),
  userFindUnique: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock("next-auth", () => ({ default: mocks.nextAuth }))
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: mocks.prismaAdapter,
}))
vi.mock("next-auth/providers/credentials", () => ({
  default: mocks.credentialsProvider,
}))
vi.mock("@/lib/password", () => ({
  verifyPassword: mocks.verifyPassword,
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

let config: NextAuthConfig

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "auth-secret")
  vi.stubEnv("NEXTAUTH_SECRET", "nextauth-secret")
  await import("@/lib/auth")
  config = mocks.nextAuth.mock.calls[0][0] as NextAuthConfig
})

afterAll(() => {
  vi.unstubAllEnvs()
})

beforeEach(() => {
  mocks.userFindUnique.mockReset()
  mocks.verifyPassword.mockReset()
})

function credentialsAuthorize() {
  const providerOptions = mocks.credentialsProvider.mock.calls[0]?.[0]

  if (
    typeof providerOptions !== "object" ||
    providerOptions === null ||
    !("authorize" in providerOptions) ||
    typeof providerOptions.authorize !== "function"
  ) {
    throw new Error("Credentials provider authorize callback was not configured")
  }

  return providerOptions.authorize as (credentials: {
    email?: unknown
    password?: unknown
  }) => Promise<unknown>
}

describe("NextAuth configuration", () => {
  it("uses JWT sessions and the custom auth pages", () => {
    expect(config.session).toEqual({
      maxAge: 60 * 60 * 24 * 7,
      strategy: "jwt",
      updateAge: 60 * 60 * 24,
    })
    expect(config.secret).toBe("auth-secret")
    expect(config.trustHost).toBe(true)
    expect(config.pages).toEqual({
      signIn: "/login",
      error: "/login",
      verifyRequest: "/login",
    })
  })

  it("configures the Credentials provider for site password login", () => {
    expect(mocks.credentialsProvider).toHaveBeenCalledWith({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: expect.any(Function),
    })
  })

  it("authorizes active users with a valid site password", async () => {
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: "https://example.com/avatar.png",
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      passwordHash: "hashed-password",
      role: "WRITER",
      username: "writer",
    })
    mocks.verifyPassword.mockResolvedValue(true)

    const result = await credentialsAuthorize()({
      email: " Writer@Example.com ",
      password: "site-password",
    })

    expect(result).toEqual({
      avatarUrl: "https://example.com/avatar.png",
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      role: "WRITER",
      username: "writer",
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "writer@example.com" },
      select: {
        avatarUrl: true,
        email: true,
        id: true,
        name: true,
        passwordHash: true,
        role: true,
        username: true,
      },
    })
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "site-password",
      "hashed-password"
    )
  })

  it("rejects credentials when the account has no site password yet", async () => {
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      passwordHash: null,
      role: "WRITER",
      username: "writer",
    })

    const result = await credentialsAuthorize()({
      email: "writer@example.com",
      password: "site-password",
    })

    expect(result).toBeNull()
    expect(mocks.verifyPassword).not.toHaveBeenCalled()
  })

  it("rejects credentials for revoked users", async () => {
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      passwordHash: "hashed-password",
      role: "REVOKED",
      username: "writer",
    })

    const result = await credentialsAuthorize()({
      email: "writer@example.com",
      password: "site-password",
    })

    expect(result).toBeNull()
    expect(mocks.verifyPassword).not.toHaveBeenCalled()
  })

  it("rejects credentials when the password is invalid", async () => {
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Writer",
      passwordHash: "hashed-password",
      role: "WRITER",
      username: "writer",
    })
    mocks.verifyPassword.mockResolvedValue(false)

    const result = await credentialsAuthorize()({
      email: "writer@example.com",
      password: "wrong-password",
    })

    expect(result).toBeNull()
  })

  it("blocks sign-in when the email has no active account", async () => {
    mocks.userFindUnique.mockResolvedValue(null)
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "candidate", email: "missing@example.com" },
    })

    expect(result).toBe(false)
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "missing@example.com" },
      select: { id: true, role: true },
    })
  })

  it("allows sign-in when the email has an account", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "writer-1", role: "WRITER" })
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "writer-1", email: "writer@example.com" },
    })

    expect(result).toBe(true)
  })

  it("blocks sign-in for revoked writers", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "writer-1", role: "REVOKED" })
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "writer-1", email: "writer@example.com" },
    })

    expect(result).toBe(false)
  })

  it("stores stable user claims in the JWT at sign-in", async () => {
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: "https://example.com/avatar.png",
      id: "writer-1",
      role: "WRITER",
      username: "writer",
    })
    const jwtCallback = config.callbacks?.jwt as unknown as (options: {
      token: {
        avatarUrl?: string | null
        role?: "ADMIN" | "WRITER" | "REVOKED"
        sub?: string
        username?: string
      }
      user?: { id?: string; email?: string }
    }) => Promise<{
      avatarUrl?: string | null
      role?: "ADMIN" | "WRITER" | "REVOKED"
      sub?: string
      username?: string
    }>

    const result = await jwtCallback({
      token: { sub: "writer-1" },
      user: { email: "writer@example.com", id: "adapter-user" },
    })

    expect(result).toMatchObject({
      avatarUrl: "https://example.com/avatar.png",
      role: "WRITER",
      sub: "writer-1",
      username: "writer",
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "writer-1" },
      select: {
        avatarUrl: true,
        id: true,
        role: true,
        username: true,
      },
    })
  })

  it("reuses complete JWT claims during navigation without a database lookup", async () => {
    const jwtCallback = config.callbacks?.jwt as unknown as (options: {
      token: {
        avatarUrl?: string | null
        role?: "ADMIN" | "WRITER" | "REVOKED"
        sub?: string
        username?: string
      }
    }) => Promise<{
      avatarUrl?: string | null
      role?: "ADMIN" | "WRITER" | "REVOKED"
      sub?: string
      username?: string
    }>

    const result = await jwtCallback({
      token: {
        avatarUrl: "https://example.com/avatar.png",
        role: "WRITER",
        sub: "writer-1",
        username: "writer",
      },
    })

    expect(result).toMatchObject({
      avatarUrl: "https://example.com/avatar.png",
      role: "WRITER",
      sub: "writer-1",
      username: "writer",
    })
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("uses JWT fields in sessions without an extra lookup", async () => {
    const session = {
      expires: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: "writer-1",
        name: "Writer",
        email: "writer@example.com",
        role: "WRITER" as const,
        username: "",
        avatarUrl: null,
      },
    }
    const sessionCallback = config.callbacks?.session as unknown as (options: {
      session: typeof session
      token: {
        avatarUrl: string | null
        role: "WRITER"
        sub: string
        username: string
      }
    }) => Promise<typeof session>

    const result = await sessionCallback({
      session,
      token: {
        avatarUrl: "https://example.com/avatar.png",
        role: "WRITER",
        sub: "writer-1",
        username: "writer",
      },
    })

    expect(result.user).toMatchObject({
      id: "writer-1",
      role: "WRITER",
      username: "writer",
      avatarUrl: "https://example.com/avatar.png",
    })
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("leaves missing JWT claims untouched instead of querying during navigation", async () => {
    const session = {
      expires: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: "writer-1",
        name: "Writer",
        email: "writer@example.com",
        role: "WRITER" as const,
        username: "",
        avatarUrl: null,
      },
    }
    const sessionCallback = config.callbacks?.session as unknown as (options: {
      session: typeof session
      token: { sub?: string }
    }) => Promise<typeof session>

    const result = await sessionCallback({
      session,
      token: { sub: "writer-1" },
    })

    expect(result.user).toMatchObject({
      id: "writer-1",
      role: "WRITER",
      username: "",
      avatarUrl: null,
    })
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })
})
