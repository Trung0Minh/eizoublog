import { expect, test } from "vitest"

test("update post error reproduction", async () => {
  const req = new Request("http://localhost:3000/api/test/login", {
    method: "POST",
    body: JSON.stringify({ role: "ADMIN" })
  })
  
})
