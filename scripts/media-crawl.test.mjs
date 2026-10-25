import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mediaUrls, crawlMedia } from "./media-crawl.mjs";

test("crawler extracts src/srcset/poster, decodes entities and resolves relative URLs", () => {
  const urls = mediaUrls('<img src="/a.png?x=1&amp;y=2" srcset="/b.png 640w, /c.png 1280w"><video poster=/p.webp src="//cdn.example/v.mp4"></video><source srcset="/d.avif 1x, /e.avif 2x"><script src="/script.js"></script><img src="data:image/png;base64,abc">', "https://site.example/path");
  assert.deepEqual(urls.sort(), ["https://site.example/a.png?x=1&y=2", "https://site.example/b.png", "https://site.example/c.png", "https://site.example/p.webp", "https://cdn.example/v.mp4", "https://site.example/d.avif", "https://site.example/e.avif"].sort());
});

test("crawler uses HEAD, deduplicates, reports 404 and inaccessible pages as failures", async () => {
  const heads = [];
  const server = createServer((req, res) => {
    if (req.url === "/") { res.end('<img src="/ok.png"><img srcset="/ok.png 1x, /missing.png 2x">'); return; }
    heads.push(req.method);
    res.writeHead(req.url === "/missing.png" ? 404 : 200); res.end();
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    const result = await crawlMedia([`http://127.0.0.1:${port}/`]);
    assert.equal(result.checked, 2); assert.equal(result.failures.length, 1); assert.equal(result.failures[0].status, 404);
    assert.deepEqual(heads, ["HEAD", "HEAD"]);
    server.close();
    assert.equal((await crawlMedia([`http://127.0.0.1:${port}/`])).failures.length, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
