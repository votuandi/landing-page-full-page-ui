import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeHost } from "../host";

test("normalizes case, port, trailing dot and IDN without merging www", () => {
  for (const [raw, expected] of [
    ["A.Example.VN:3000", "a.example.vn"], ["WWW.Example.VN.:443", "www.example.vn"],
    ["nănglượng.vn", "xn--nnglng-i0a10lfy0m.vn"], ["t15.localhost:3000", "t15.localhost"],
  ]) assert.equal(normalizeHost(raw), expected);
});

test("rejects malformed authorities, credentials, escaped characters and IPv6", () => {
  for (const raw of [null, "", " ", "a b.vn", "a.vn/path", "a.vn\\path", "user@a.vn", "a.vn?x", "a.vn#x", "a.vn,b.vn", "[::1]:80", "::1", "a.vn:abc", "a.vn:", "a.vn:65536", "a..vn", "-a.vn", "a_.vn", "%61.vn", "a.vn\n"]) {
    assert.equal(normalizeHost(raw), null, String(raw));
  }
});
