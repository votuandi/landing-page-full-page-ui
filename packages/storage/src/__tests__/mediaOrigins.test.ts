import assert from "node:assert/strict";
import { test } from "node:test";
import { mediaOrigins } from "../mediaOrigins.ts";

test("mediaOrigins: unique http(s) origins of every MEDIA_PUBLIC_BASE key; unset, invalid and other schemes ignored", () => {
  assert.deepEqual(mediaOrigins({}), []);
  assert.deepEqual(mediaOrigins({
    MEDIA_PUBLIC_BASE: "http://localhost:3212/media",
    MEDIA_PUBLIC_BASE_LOCAL: "http://localhost:3212/other",
    MEDIA_PUBLIC_BASE_S3: "https://cdn.example.com/bucket/",
  }), ["http://localhost:3212", "https://cdn.example.com"]);
  assert.deepEqual(mediaOrigins({ MEDIA_PUBLIC_BASE: "not a url", MEDIA_PUBLIC_BASE_S3: "javascript:alert(1)" }), []);
  // A CSP source list is space/semicolon separated: an origin can never carry either.
  assert.deepEqual(mediaOrigins({ MEDIA_PUBLIC_BASE: "https://cdn.example.com/a;script-src *" }), ["https://cdn.example.com"]);
});
