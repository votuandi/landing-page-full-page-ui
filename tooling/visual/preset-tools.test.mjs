import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize, measure } from "./ttfb.mjs";
import { createServer } from "node:http";
import { options } from "./template-compare.mjs";

test("TTFB summary sorts without mutation and reports median/p90/p95", () => {
  const samples = [50, 10, 40, 20, 30];
  assert.deepEqual(summarize(samples), { median: 30, p90: 50, p95: 50 });
  assert.deepEqual(samples, [50, 10, 40, 20, 30]);
  assert.equal(summarize([20, 10]).median, 15);
  assert.deepEqual(summarize(Array.from({ length: 100 }, (_, i) => i + 1)), { median: 50.5, p90: 90, p95: 95 });
});
test("TTFB rejects error responses instead of measuring an error page", async () => {
  const server = createServer((_, res) => { res.writeHead(500); res.end("broken"); });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  try { await assert.rejects(measure(`http://127.0.0.1:${server.address().port}`), /500/); }
  finally { await new Promise((done) => server.close(done)); }
});
test("TTFB requests HTML with the same User-Agent as the content gate", async () => {
  let headers;
  const server = createServer((req, res) => { headers = req.headers; res.end("<main>tenant</main>"); });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  try {
    await measure(`http://127.0.0.1:${server.address().port}`);
    assert.equal(headers["user-agent"], "solar-ttfb");
    assert.equal(headers.accept, "text/html");
  } finally { await new Promise((done) => server.close(done)); }
});
test("comparison CLI validates id, port and option names", () => {
  assert.equal(options(["t15"]).port, 4100);
  assert.equal(options(["t15", "--port", "4200"]).port, 4200);
  for (const args of [["../bad"], ["t15", "--port", "0"], ["t15", "--app"], ["t15", "--unknown", "x"]]) {
    assert.throws(() => options(args));
  }
});
