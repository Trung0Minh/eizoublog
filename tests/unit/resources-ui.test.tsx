import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  updateResourcesPage: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock("@/app/(public)/resources/actions", () => ({
  updateResourcesPage: mocks.updateResourcesPage,
}))

import { ResourcesClient } from "@/app/(public)/resources/ResourcesClient"

describe("ResourcesClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateResourcesPage.mockResolvedValue({ id: "resources" })
  })

  it("moves resources up and down before saving", async () => {
    const user = userEvent.setup()

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              { description: "First", domain: "First", logo: "", url: "https://first.test" },
              { description: "Second", domain: "Second", logo: "", url: "https://second.test" },
              { description: "Third", domain: "Third", logo: "", url: "https://third.test" },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))
    await user.click(screen.getByRole("button", { name: "Di chuyển Second lên" }))
    await user.click(screen.getByRole("button", { name: "Di chuyển First xuống" }))
    await user.click(screen.getByRole("button", { name: /^Lưu$/ }))

    await waitFor(() => {
      expect(mocks.updateResourcesPage).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: [
            expect.objectContaining({ domain: "Second" }),
            expect.objectContaining({ domain: "Third" }),
            expect.objectContaining({ domain: "First" }),
          ],
        }),
      )
    })
  })
})
