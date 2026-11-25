import assert from "node:assert/strict";
import { test } from "node:test";
import { adminCsp } from "../lib/csp.ts";
import { previewOrigin, previewUrl } from "../lib/previewUrl.ts";

test("admin CSP dev vs production and preview origins", () => {
  for (const production of [false, true]) {
    const input = { slug: "a", platform: "solar.vn", production, port: "3212" };
    const origin = previewOrigin(input);
    assert.equal(new URL(previewUrl({ ...input, path: "/", token: "token" })).origin, origin);
    const csp = adminCsp({ nonce: "generated", production, previewOrigin: origin });
    assert.equal(csp.includes("'unsafe-eval'"), !production);
    assert.equal(csp.includes(" ws:"), !production);
    assert.ok(csp.split("; ").includes(`frame-src ${origin} https://www.youtube-nocookie.com https://www.youtube.com https://www.tiktok.com`));
    assert.ok(csp.includes("connect-src 'self' https:"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.doesNotMatch(csp.split("; ").find(d => d.startsWith("script-src"))!, /unsafe-inline/);
  }
});

test("admin CSP allows configured http media origins for images and video only", () => {
  const csp = adminCsp({ nonce: "bm9uY2U=", production: true, mediaOrigins: ["http://localhost:3212"] });
  const directive = (name: string) => csp.split("; ").find(part => part.startsWith(`${name} `)) ?? "";
  assert.match(directive("img-src"), / http:\/\/localhost:3212( |$)/);
  assert.match(directive("media-src"), / http:\/\/localhost:3212( |$)/);
  for (const name of ["script-src", "connect-src", "frame-src", "default-src"]) assert.doesNotMatch(directive(name), /localhost:3212/);
});
