import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertWithinLimit } from "@solar/plans";
import { entitlementResponse, PAGE_TAGS } from "../entitlements";

const site = { planId: "basic", addons: [], status: "active", createdAt: new Date("2026-01-01T00:00:00Z") };
const GB = 1024 ** 3;

test("upload over mediaGb → 413 with a Vietnamese message (helper E8-S02 wires into the upload route)", async () => {
  let response: Response | undefined;
  try { assertWithinLimit(site, "mediaGb", 0.9 * GB, 0.2 * GB); } catch (error) { response = entitlementResponse(error); }
  assert.equal(response?.status, 413);
  const body = await response!.json();
  assert.equal(body.ok, false);
  assert.match(body.message, /Vượt dung lượng media của gói.*giới hạn 1 GB/);
  // limitOverrides raise the quota.
  assert.doesNotThrow(() => assertWithinLimit({ ...site, limitOverrides: { mediaGb: { add: 1, reason: "mua thêm" } } }, "mediaGb", 0.9 * GB, 0.2 * GB));
  assert.throws(() => entitlementResponse(new Error("other")), /other/);
  assert.deepEqual(PAGE_TAGS, ["platform:entitlements"]);
});

// Target E6-S02: every current entry point checks entitlements. New entry points must be added here.
const ENTRY_POINTS: Readonly<Record<string, RegExp>> = {
  "app/sites/[tenantId]/[siteId]/[ctx]/layout.tsx": /<TenantChrome /, // cached chrome below
  "app/sites/[tenantId]/[siteId]/[ctx]/[[...path]]/page.tsx": /tenantRenderKey\(site, preview\)[\s\S]*tenantPage\(key, slug\)[\s\S]*outcome.content/, // cached page below
  "components/tenant/cached.tsx": /siteCanUse\(site\)[\s\S]*siteCanUse\(site\)[\s\S]*siteCanUse\(site\)/, // routes, landing pages, PageRenderer, chrome, widgets, cart
  "components/tenant/SystemPages.tsx": /siteCanUse\(site\)/, // system pages, cart, calculator CTA
  "lib/tenant/seoData.ts": /siteCanUse\(site\)/, // sitemap
  "lib/tenant/leadIntake.ts": /assertCan\(/, // POST /api/lead (tenant)
  "app/api/lead/route.ts": /tenantLeadHandler\(/,
};
const src = join(process.cwd(), "src");
const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "__tests__" ? [] : files(path)) : /\.tsx?$/.test(name) ? [path] : [];
});

test("100% of entry points check entitlements; nobody resolves plans directly", () => {
  for (const [file, pattern] of Object.entries(ENTRY_POINTS)) assert.match(readFileSync(join(src, file), "utf8"), pattern, file);
  // Tenant routes and APIs are all listed above.
  const tenantEntries = files(join(src, "app")).map((path) => path.slice(src.length + 1).replaceAll("\\", "/"))
    .filter((path) => path.startsWith("app/sites/") || path.startsWith("app/api/"));
  assert.deepEqual(tenantEntries.filter((path) => !(path in ENTRY_POINTS)).sort(),
    ["app/api/preview/route.ts", "app/api/revalidate/route.ts", "app/sites/[tenantId]/[siteId]/[ctx]/not-found.tsx", "app/sites/[tenantId]/[siteId]/robots.txt/route.ts", "app/sites/[tenantId]/[siteId]/sitemap.xml/route.ts"], "preview only enables authenticated Draft Mode; render checks entitlements; sitemap delegates to seoData");
  for (const path of files(src)) assert.doesNotMatch(readFileSync(path, "utf8"), /\bgetPlan\(|\.features\.has\(|planCanUse/, path);
});
