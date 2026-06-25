import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  inviteCreate: vi.fn(),
  inviteDelete: vi.fn(),
  inviteFindFirst: vi.fn(),
  inviteFindUnique: vi.fn(),
  inviteUpdate: vi.fn(),
  passwordResetTokenCreate: vi.fn(),
  passwordResetTokenFindUnique: vi.fn(),
  passwordResetTokenUpdate: vi.fn(),
  createPasswordResetToken: vi.fn(),
  getPasswordResetExpiresAt: vi.fn(),
  hashPassword: vi.fn(),
  hashPasswordResetToken: vi.fn(),
  revalidateTag: vi.fn(),
  sendInviteEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/password", () => ({ hashPassword: mocks.hashPassword }))
vi.mock("@/lib/passwordReset", () => ({
  createPasswordResetToken: mocks.createPasswordResetToken,
  getPasswordResetExpiresAt: mocks.getPasswordResetExpiresAt,
  hashPasswordResetToken: mocks.hashPasswordResetToken,
}))
vi.mock("@/lib/resend", () => ({
  sendInviteEmail: mocks.sendInviteEmail,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}))
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
    (...args: Args) =>
      fn(...args),
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invite: {
      create: mocks.inviteCreate,
      delete: mocks.inviteDelete,
      findFirst: mocks.inviteFindFirst,
      findUnique: mocks.inviteFindUnique,
      update: mocks.inviteUpdate,
    },
    passwordResetToken: {
      create: mocks.passwordResetTokenCreate,
      findUnique: mocks.passwordResetTokenFindUnique,
      update: mocks.passwordResetTokenUpdate,
    },
    user: {
      create: mocks.userCreate,
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    $transaction: mocks.transaction,
  },
}))

import { POST as forgotPassword } from "@/app/api/auth/password/forgot/route"
import { POST as resetPassword } from "@/app/api/auth/password/reset/route"
import { POST as acceptInvite } from "@/app/api/invite/accept/route"
import { POST as createInvite } from "@/app/api/invite/route"

const adminSession = {
  user: {
    id: "admin-1",
    name: "Admin Writer",
    role: "ADMIN",
  },
}

const adminDbUser = {
  avatarUrl: null,
  email: "admin@example.com",
  id: "admin-1",
  name: "Admin Writer",
  role: "ADMIN",
  username: "admin",
}

function mockCreateInviteUserLookup(existingEmailUser: unknown = null) {
  mocks.userFindUnique.mockImplementation(async (query: unknown) => {
    const where =
      typeof query === "object" && query !== null && "where" in query
        ? query.where
        : null

    if (
      typeof where === "object" &&
      where !== null &&
      "id" in where &&
      where.id === "admin-1"
    ) {
      return adminDbUser
    }

    if (typeof where === "object" && where !== null && "email" in where) {
      return existingEmailUser
    }

    return null
  })
}

function postRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(adminSession)
    mockCreateInviteUserLookup()
    mocks.inviteFindFirst.mockResolvedValue(null)
    mocks.inviteCreate.mockResolvedValue({ token: "invite-token" })
    mocks.inviteDelete.mockResolvedValue({ id: "invite-1" })
    mocks.sendInviteEmail.mockResolvedValue(undefined)
  })

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("rejects non-admin users", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", name: "Writer", role: "WRITER" },
    })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("creates and emails an invite for a new writer", async () => {
    const response = await createInvite(
      postRequest("/api/invite", { email: " Writer@Example.com " })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Invite sent successfully" },
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "writer@example.com" },
      select: { id: true },
    })
    expect(mocks.inviteCreate).toHaveBeenCalledWith({
      data: {
        email: "writer@example.com",
        expiresAt: expect.any(Date),
        createdById: "admin-1",
      },
      select: { token: true },
    })
    expect(mocks.sendInviteEmail).toHaveBeenCalledWith({
      to: "writer@example.com",
      inviteToken: "invite-token",
      invitedByName: "Admin Writer",
    })
    expect(mocks.inviteFindFirst).toHaveBeenCalledWith({
      where: {
        email: "writer@example.com",
        status: "PENDING",
        expiresAt: { gt: expect.any(Date) },
      },
      select: { id: true },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("invites", "max")
  })

  it("rejects an email that already has an account", async () => {
    mockCreateInviteUserLookup({ id: "writer-1" })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This email already has an account",
    })
    expect(mocks.inviteCreate).not.toHaveBeenCalled()
  })

  it("rejects an email with a pending invite", async () => {
    mocks.inviteFindFirst.mockResolvedValue({ id: "invite-1" })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "A pending invite already exists for this email",
    })
    expect(mocks.inviteCreate).not.toHaveBeenCalled()
  })

  it("returns a validation error for an invalid email", async () => {
    const response = await createInvite(
      postRequest("/api/invite", { email: "not-an-email" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    })
  })

  it("removes the invite when email delivery fails so it can be retried", async () => {
    mocks.sendInviteEmail.mockRejectedValue(new Error("Resend failed"))

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error:
        "Invite email could not be sent. Check the Resend configuration and sender domain.",
    })
    expect(mocks.inviteDelete).toHaveBeenCalledWith({
      where: { token: "invite-token" },
      select: { id: true },
    })
  })
})

describe("POST /api/invite/accept", () => {
  const validInvite = {
    id: "invite-1",
    email: "writer@example.com",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 60_000),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.inviteFindUnique.mockResolvedValue(validInvite)
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue({ id: "writer-1" })
    mocks.hashPassword.mockResolvedValue("hashed-password")
    mocks.inviteUpdate.mockResolvedValue({ id: "invite-1" })
    mocks.transaction.mockResolvedValue([])
  })

  it("rejects an invalid invite token", async () => {
    mocks.inviteFindUnique.mockResolvedValue(null)

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invalid",
        name: "New Writer",
        username: "new_writer",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid invite link",
    })
  })

  it("marks an expired invite before rejecting it", async () => {
    mocks.inviteFindUnique.mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 60_000),
    })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "expired",
        name: "New Writer",
        username: "new_writer",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This invite link has expired",
    })
    expect(mocks.inviteUpdate).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "EXPIRED" },
      select: { id: true },
    })
  })

  it("rejects a username that is already taken", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-writer" })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "existing_writer",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Username is already taken",
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("rejects an invite when its email already has an account", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ id: "existing-writer" })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "new_writer",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This email already has an account",
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("creates the writer and accepts the invite in one transaction", async () => {
    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: " New Writer ",
        username: "new_writer",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Account created successfully" },
    })
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: "writer@example.com",
        name: "New Writer",
        passwordHash: "hashed-password",
        username: "new_writer",
        role: "WRITER",
      },
      select: { id: true },
    })
    expect(mocks.hashPassword).toHaveBeenCalledWith("secure-password")
    expect(mocks.inviteUpdate).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "ACCEPTED" },
      select: { id: true },
    })
    expect(mocks.transaction).toHaveBeenCalledOnce()
    expect(mocks.revalidateTag).toHaveBeenCalledWith("users", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("invites", "max")
  })

  it("returns a validation error for an invalid username", async () => {
    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "Invalid Username",
        password: "secure-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    })
  })

  it("rejects a weak site password", async () => {
    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "new_writer",
        password: "short",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    })
    expect(mocks.hashPassword).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/password/forgot", () => {
  const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createPasswordResetToken.mockReturnValue("raw-reset-token")
    mocks.hashPasswordResetToken.mockReturnValue("hashed-reset-token")
    mocks.getPasswordResetExpiresAt.mockReturnValue(resetExpiresAt)
    mocks.passwordResetTokenCreate.mockResolvedValue({ id: "reset-1" })
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined)
  })

  it("sends reset mail only for an active invited account", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "writer@example.com",
      id: "writer-1",
      role: "WRITER",
    })

    const response = await forgotPassword(
      postRequest("/api/auth/password/forgot", {
        email: " Writer@Example.com ",
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        message:
          "If this email belongs to an invited writer, a reset link has been sent.",
      },
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "writer@example.com" },
      select: { email: true, id: true, role: true },
    })
    expect(mocks.passwordResetTokenCreate).toHaveBeenCalledWith({
      data: {
        expiresAt: resetExpiresAt,
        tokenHash: "hashed-reset-token",
        userId: "writer-1",
      },
      select: { id: true },
    })
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({
      resetUrl: "http://localhost/reset-password/raw-reset-token",
      to: "writer@example.com",
    })
  })

  it("does not send reset mail for unknown emails", async () => {
    mocks.userFindUnique.mockResolvedValue(null)

    const response = await forgotPassword(
      postRequest("/api/auth/password/forgot", {
        email: "reader@example.com",
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        message:
          "If this email belongs to an invited writer, a reset link has been sent.",
      },
    })
    expect(mocks.passwordResetTokenCreate).not.toHaveBeenCalled()
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("does not send reset mail for revoked accounts", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "revoked@example.com",
      id: "writer-1",
      role: "REVOKED",
    })

    const response = await forgotPassword(
      postRequest("/api/auth/password/forgot", {
        email: "revoked@example.com",
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.passwordResetTokenCreate).not.toHaveBeenCalled()
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/password/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hashPassword.mockResolvedValue("new-hashed-password")
    mocks.hashPasswordResetToken.mockReturnValue("hashed-reset-token")
    mocks.passwordResetTokenUpdate.mockReturnValue("reset-update")
    mocks.userUpdate.mockReturnValue("user-update")
    mocks.transaction.mockResolvedValue([])
  })

  it("sets a new site password and marks the reset token used", async () => {
    mocks.passwordResetTokenFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      id: "reset-1",
      usedAt: null,
      user: { role: "WRITER" },
      userId: "writer-1",
    })

    const response = await resetPassword(
      postRequest("/api/auth/password/reset", {
        token: "raw-reset-token",
        password: "new-site-password",
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Password updated successfully" },
    })
    expect(mocks.passwordResetTokenFindUnique).toHaveBeenCalledWith({
      where: { tokenHash: "hashed-reset-token" },
      select: {
        expiresAt: true,
        id: true,
        usedAt: true,
        user: { select: { role: true } },
        userId: true,
      },
    })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "writer-1" },
      data: { passwordHash: "new-hashed-password" },
      select: { id: true },
    })
    expect(mocks.passwordResetTokenUpdate).toHaveBeenCalledWith({
      where: { id: "reset-1" },
      data: { usedAt: expect.any(Date) },
      select: { id: true },
    })
    expect(mocks.transaction).toHaveBeenCalledWith(["user-update", "reset-update"])
  })

  it("rejects invalid reset tokens", async () => {
    mocks.passwordResetTokenFindUnique.mockResolvedValue(null)

    const response = await resetPassword(
      postRequest("/api/auth/password/reset", {
        token: "bad-token",
        password: "new-site-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This reset link is invalid or has expired.",
    })
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  it("rejects used reset tokens", async () => {
    mocks.passwordResetTokenFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      id: "reset-1",
      usedAt: new Date(),
      user: { role: "WRITER" },
      userId: "writer-1",
    })

    const response = await resetPassword(
      postRequest("/api/auth/password/reset", {
        token: "used-token",
        password: "new-site-password",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This reset link is invalid or has expired.",
    })
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })
})
