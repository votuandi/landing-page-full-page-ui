import assert from "node:assert/strict";
import { test } from "node:test";
import { siteConfig as t15 } from "../../../../apps/web/src/config/site.config.ts";
import { siteConfig as t14 } from "./fixtures/siteConfig-t14.ts";
import { mapSiteConfig } from "../siteConfigImport.ts";
import { siteProfileSchema } from "../siteProfile.ts";
for (const [name, config] of [["t15", t15], ["t14", t14]] as const) test(`maps ${name} site.config`, () => {
  const mapped = mapSiteConfig(config);
  assert.ok(siteProfileSchema.safeParse(mapped.profile).success);
  assert.equal(mapped.branches.length, config.branches.length);
  assert.deepEqual(mapped.branches.map(b => b.slug), config.branches.map(b => b.id));
  assert.ok(mapped.unmapped.some(key => key.startsWith("hero")));
  assert.ok(mapped.unmapped.some(key => key.includes("E13-S02")));
  assert.equal(mapped.profile.brand.legalName, config.brand.legalName);
});
test("invalid config reports field paths before any writes", () => {
  assert.throws(() => mapSiteConfig({ brand: { email: "invalid" } }), /email/);
  assert.throws(() => mapSiteConfig(undefined));
  assert.throws(() => mapSiteConfig({ ...t15, i18n: { enabled: "false", defaultLang: "invalid" } }), /i18n/);
});
test("invalid branch identifiers cannot fall back to generated slugs", () => {
  for (const branches of [[{ ...t15.branches[0], id: undefined }], [{ ...t15.branches[0], id: "bad/slug" }], [t15.branches[0], t15.branches[0]]]) assert.throws(() => mapSiteConfig({ ...t15, branches }), /branches/);
});
