import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaServer } from "./media-server.mjs";

test("media server confines public paths, supports GET/HEAD and bounded video Range", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-http-"));
  const server = createMediaServer(root);
  try {
    const folder = join(root, "tenants/20c7d32c-e48f-40de-a9ea-3db1b71735c6");
    await mkdir(folder, { recursive: true }); await writeFile(join(folder, "a.mp4"), Buffer.from("0123456789"));
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const path = "/media/tenants/20c7d32c-e48f-40de-a9ea-3db1b71735c6/a.mp4";
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(base + path, { method });
      assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "video/mp4");
      assert.equal(response.headers.get("content-length"), "10"); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(await response.text(), method === "GET" ? "0123456789" : "");
    }
    for (const [range, expected, contentRange] of [["bytes=0-2", "012", "bytes 0-2/10"], ["bytes=8-", "89", "bytes 8-9/10"], ["bytes=-2", "89", "bytes 8-9/10"], ["bytes=8-999", "89", "bytes 8-9/10"]]) {
      const response = await fetch(base + path, { headers: { Range: range } });
      assert.equal(response.status, 206); assert.equal(response.headers.get("content-range"), contentRange); assert.equal(await response.text(), expected);
    }
    for (const range of ["bytes=99-", "bytes=5-2", "bytes=-0", "bytes=0-1,3-4", "bad", "bytes=99999999999999999999-"]) {
      const response = await fetch(base + path, { headers: { Range: range } });
      assert.equal(response.status, 416); assert.equal(response.headers.get("content-range"), "bytes */10");
    }
    for (const path of ["/tenants/20c7d32c-e48f-40de-a9ea-3db1b71735c6/a.mp4", "/media/private/x.mp4", "/media/quarantine/x.mp4", "/media/tenants/x/%2e%2e%2fsecret", "/media/tenants/x/a%5cb", "/media/tenants/x/a%00b"]) assert.equal((await fetch(base + path)).status, 403);
    assert.equal((await fetch(base + path, { method: "POST" })).status, 405);
    assert.equal((await fetch(base + path.replace("a.mp4", "missing.mp4"))).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
