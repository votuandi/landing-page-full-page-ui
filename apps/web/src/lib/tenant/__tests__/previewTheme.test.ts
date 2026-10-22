import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { getTheme } from "@solar/themes";
import { applyPreviewTheme } from "../previewTheme";
import { tenantRenderKey } from "../renderKey";
import type { TenantSite } from "../siteData";
const site = { tenantId: "tenant", siteId: "site", locale: "vi", theme: getTheme("t01")!, entitlements: { planId: "basic", disabled: [] }, context: { themeId: "t01" } } as unknown as TenantSite;
test("applyPreviewTheme previews locked theme without modifying published site", () => {
  assert.equal(applyPreviewTheme(site, "t15").theme.meta.id, "t15");
  assert.equal(applyPreviewTheme(site, "unknown"), site);
  const preview = applyPreviewTheme(site, "t02");
  assert.equal(preview.theme.meta.id, "t02"); assert.equal(preview.context.themeId, "t02");
  assert.equal(site.theme.meta.id, "t01");
});
test("published route ignores theme cookie", () => {
  assert.equal(tenantRenderKey(site, false).themeId, undefined);
  assert.equal(tenantRenderKey(site, true).themeId, "t01");
  const route = readFileSync("src/lib/tenant/route.ts", "utf8");
  assert.match(route, /if \(context\.preview\)[\s\S]*cookies\(\)/);
});
