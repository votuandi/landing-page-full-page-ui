import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import type { PlatformDb } from "@solar/db";
import { createMediaRuntime } from "../mediaRuntime.ts";

test("sharp limits", () => {
  const concurrency = sharp.concurrency(), cache = sharp.cache();
  try {
    sharp.concurrency(4); sharp.cache(true);
    createMediaRuntime({} as PlatformDb);
    assert.equal(sharp.concurrency(), 1);
    assert.equal(sharp.cache().memory.max, 0);
    assert.equal(sharp.cache().files.max, 0);
    assert.equal(sharp.cache().items.max, 0);
  } finally {
    sharp.concurrency(concurrency);
    sharp.cache({ memory: cache.memory.max, files: cache.files.max, items: cache.items.max });
  }
});
