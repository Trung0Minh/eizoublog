import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("/api/categories", () => {
    return HttpResponse.json({ data: [] })
  }),
  http.get("/api/user/notification-counts", () => {
    return HttpResponse.json({ data: { count: 0 } })
  }),
]
