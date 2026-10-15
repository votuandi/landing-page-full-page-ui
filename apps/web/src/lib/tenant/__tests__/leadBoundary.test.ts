import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/lead/route";

test("tenant lead rejects before JSON/honeypot/shared adapter dispatch", async () => {
  for (const body of ["invalid JSON", JSON.stringify({ website: "bot" }), JSON.stringify({ name: "A", phone: "0901234500" })]) {
    const request = new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": "a" }, body });
    const result = await POST(request);
    assert.equal(result.status, 503);
    assert.equal((await result.json()).ok, false);
  }
  const legacy = await POST(new Request("http://localhost/api/lead", { method: "POST", body: JSON.stringify({ website: "bot" }) }));
  assert.equal(legacy.status, 200);
});
