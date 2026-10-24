import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { getTheme, withFontOverride } from "@solar/themes";
import { applyPreviewTheme } from "../previewTheme";
import { tenantRenderKey } from "../renderKey";
import type { TenantSite } from "../siteData";
const site = { tenantId: "tenant", siteId: "site", locale: "vi", theme: getTheme("t01")!, entitlements: { planId: "basic", disabled: [] }, context: { themeId: "t01" } } as unknown as TenantSite;

test("preview font override applies to preview theme and falls back when weights incompatible", () => {
  const source = { ...site, theme: getTheme("t15")!, font: { display: "Manrope" } };
  const preview = applyPreviewTheme(source, "t01");
  assert.equal(withFontOverride(preview.theme, preview.font) ?? preview.theme, preview.theme);
  const compatible = applyPreviewTheme(source, "t07");
  assert.equal(withFontOverride(compatible.theme, compatible.font)?.font.display, "Manrope");
  assert.equal(source.theme.meta.id, "t15");
});
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
