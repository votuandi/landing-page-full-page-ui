import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { sectionRegistry } from "@solar/sections";
import { thumbnailSrc } from "../sections/thumbnails.ts";
import { sectionThumbnails } from "../sections/thumbnails.generated.ts";

test("manifest covers registry × themes; regenerate with pnpm --filter @solar/visual thumbnails", () => {
  for (const theme of Array.from({ length: 15 }, (_, i) => `t${String(i + 1).padStart(2, "0")}`)) {
    for (const type of Object.keys(sectionRegistry.types)) for (const variant of sectionRegistry.variantsOf(type) ?? []) {
      const src = thumbnailSrc(theme, type, variant);
      assert.ok(src, `Missing ${theme}/${type}--${variant}: pnpm --filter @solar/visual thumbnails`);
      assert.ok(existsSync(new URL(`../../../../apps/admin/public${src}`, import.meta.url)), src);
    }
  }
  assert.ok(Object.keys(sectionThumbnails).length > 0);
});
test("unknown theme, variant and type return undefined instead of broken image URLs", () => {
  for (const args of [["unknown", "hero", "t15"], ["t15", "missing", "t15"], ["t15", "hero", "missing"], ["__proto__", "constructor", "prototype"]]) {
    assert.equal(thumbnailSrc(...args as [string, string, string]), undefined);
  }
});
