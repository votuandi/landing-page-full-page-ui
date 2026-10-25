import assert from "node:assert/strict";
import { test } from "node:test";
import { isAbsolute, join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import config from "../../../../next.config.ts";

test("cache handlers config: native JS default handler without ISR cacheHandler", async () => {
  assert.equal(config.cacheHandler, undefined);
  const path = config.cacheHandlers?.default;
  assert.ok(path && isAbsolute(path) && existsSync(path));
  // The handler must load on plain Node (no TS/build step), even without Redis.
  await promisify(execFile)(process.execPath, ["--input-type=module", "-e", `
    const handler = (await import(${JSON.stringify(pathToFileURL(path).href)})).default;
    for (const method of ['get', 'set', 'refreshTags', 'getExpiration', 'updateTags']) {
      if (typeof handler[method] !== 'function') throw Error(method);
    }
    if (globalThis[Symbol.for('solar.cache.redis')]) throw Error('fallback opened Redis');
  `], { env: { ...process.env, REDIS_URL: "" }, timeout: 5000 });
});

test("cache handlers config survives Next's Node 20 config transpiler", async () => {
  const { transpileConfig } = createRequire(import.meta.url)("next/dist/build/next-config-ts/transpile-config.js");
  const dir = fileURLToPath(new URL("../../../../", import.meta.url));
  const loaded = await transpileConfig({ nextConfigPath: join(dir, "next.config.ts"), dir });
  assert.equal(loaded.default.cacheHandlers.default, join(dir, "cache-handler.mjs"));
});
