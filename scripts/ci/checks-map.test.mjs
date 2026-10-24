import assert from "node:assert/strict";
import test from "node:test";
import { affectedChecks, e2eScope, CHECKS, workspaceLinks } from "./checks-map.mjs";

test("E8-S01: storage selects its contract suite and does not select unrelated suites", () => {
  assert.equal(CHECKS.storage?.cmd, "bash scripts/local-ci.sh storage");
  for (const file of ["packages/storage/src/index.ts", "packages/storage/package.json", "scripts/local-ci.sh", ".github/workflows/workspace.yml"]) {
    assert.deepEqual(affectedChecks([file]), ["storage"]);
  }
  assert.ok(affectedChecks(["pnpm-lock.yaml"]).includes("storage"));
  assert.ok(affectedChecks(["scripts/ci/checks-map.mjs"]).includes("storage"));
  assert.deepEqual(affectedChecks(["packages/storage/README.md", "packages/storage/src/__tests__/storage.test.ts"]), []);
});

test("sửa bảng checks-map không kéo matrix/visual (ảnh chụp không phụ thuộc bảng; logic bảng do file test này kiểm)", () => {
  const checks = affectedChecks(["scripts/ci/checks-map.mjs"]);
  assert.ok(!checks.includes("matrix") && !checks.includes("visual"));
  assert.ok(checks.includes("db") && checks.includes("e2e:tenant"));
});

// File thật của PR #52 (E6-S04): CI đỏ ở tenant.spec vì plan không chọn e2e tenant.
const e6s04 = ["pnpm-lock.yaml", "packages/cms-ui/package.json","apps/admin/src/lib/appearance.ts", "apps/admin/src/components/AppearanceForm.tsx",
  "apps/web/src/app/(site)/lab/cms-sections/CmsSectionsLab.tsx", "apps/web/src/lib/tenant/siteData.ts",
  "apps/web/src/lib/tenant/previewTheme.ts", "packages/cms-ui/src/sections/SectionListEditor.tsx", "packages/db/prisma/seed-data.ts",
  "packages/presets/src/structure.ts", "tooling/visual/admin.spec.ts", "tooling/visual/cms-sections.spec.ts", "tooling/visual/README.md"];

test("E6-S04: đòi e2e tenant/preview/admin/sections + db, không chạy matrix", () => {
  const checks = affectedChecks(e6s04);
  for (const name of ["db", "e2e:tenant", "e2e:preview", "e2e:admin", "e2e:sections"]) assert.ok(checks.includes(name), name);
  assert.ok(!checks.includes("matrix"));
});

test("đổi section/theme/token → matrix; trang tenant không kéo matrix", () => {
  assert.ok(affectedChecks(["packages/sections/src/hero/t12.tsx"]).includes("matrix"));
  assert.ok(affectedChecks(["packages/themes/t05/theme.ts"]).includes("matrix"));
  assert.ok(affectedChecks(["apps/web/src/components/SiteShell.tsx"]).includes("matrix"));
  assert.ok(!affectedChecks(["apps/web/src/components/tenant/cached.tsx"]).includes("matrix"));
  assert.ok(!affectedChecks(["apps/admin/src/lib/upgrade.ts"]).includes("matrix"));
});

test("chỉ tài liệu → không bộ kiểm nào; đường dẫn Windows được chuẩn hóa", () => {
  assert.deepEqual(affectedChecks(["tooling/visual/README.md", "roadmap/plans/E6-S04.md"]), []);
  assert.ok(affectedChecks(["apps\\admin\\src\\lib\\upgrade.ts"]).includes("e2e:admin"));
});

// Diff -U0 thật của E7-S14 (admin.spec.ts): import mới + một test mới, rồi sửa trong thân test đó.
const e7s14 = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -4,0 +5,2 @@ import { resolve } from "node:path";
+import { readFile } from "node:fs/promises";
+import { parseCsv, toCsv } from "../../packages/db/src/csv";
@@ -36,0 +39,3 @@ test.afterAll(() => fixture("cleanup"));
+
+test("products: CSV export, preview error, import", async ({ page }, info) => {
+  await login(page);
@@ -91 +92 @@ test("products: CSV export, preview error, import", async ({ page }, info) => {
-  await expect(a).toBeVisible();
+  await expect(b).toBeVisible();
`;
const scope = (files, diff, options) => Object.fromEntries(e2eScope(files, diff, options).map((s) => [s.name, s]));

test("e2e theo phạm vi: chỉ test mới/sửa của story (E7-S14 → grep đúng một test admin)", () => {
  const s = scope(["packages/db/src/productCsv.ts", "apps/admin/src/components/ProductCsv.tsx", "tooling/visual/admin.spec.ts"], e7s14);
  assert.equal(s["e2e:admin"].mode, "grep");
  assert.equal(s["e2e:admin"].grep, "products: CSV export, preview error, import");
  // packages/db/src kéo tenant/preview nhưng story không đổi spec của chúng → không chạy e2e, chỉ cảnh báo.
  assert.equal(s["e2e:tenant"].mode, "none");
  assert.equal(s["e2e:preview"].mode, "none");
  assert.equal(s.db, undefined, "db là unit/int, không thuộc e2e");
});

test("e2e theo phạm vi: sửa ngoài thân test (hook, helper) → chạy cả file spec; ký tự regex được escape", () => {
  const hook = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -30 +30 @@ test.beforeAll(async ({ request }) => {
-  fixture("setup");
+  fixture("setup", "x");
`;
  assert.deepEqual(scope(["tooling/visual/admin.spec.ts"], hook)["e2e:admin"], { name: "e2e:admin", mode: "files", files: ["tooling/visual/admin.spec.ts"] });
  const special = `diff --git a/tooling/visual/tenant.spec.ts b/tooling/visual/tenant.spec.ts
@@ -10,0 +11 @@ test("a", () => {});
+test("robots (EN) + sitemap?", async () => {});
`;
  assert.equal(scope(["tooling/visual/tenant.spec.ts"], special)["e2e:tenant"].grep, String.raw`robots \(EN\) \+ sitemap\?`);
});

test("e2e theo phạm vi: story đến lượt regression → mọi bộ e2e chạy toàn bộ", () => {
  const s = scope(["README.md"], "", { full: true });
  for (const name of ["e2e:tenant", "e2e:preview", "e2e:admin", "e2e:sections", "e2e:production"]) assert.equal(s[name].mode, "full", name);
});

test("e2e theo phạm vi: dòng cấp file sau một test (const, test.describe) → cả file; chỉ đổi import → cả file, không grep rỗng", () => {
  const helperAfterTest = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -50,0 +51 @@ test("A", async () => {
+const pick = (rows) => rows[0];
`;
  assert.equal(scope(["tooling/visual/admin.spec.ts"], helperAfterTest)["e2e:admin"].mode, "files");
  const nested = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -50,0 +51,4 @@ test("A", async () => {
+test("B", async () => {});
+test.describe("nhóm", () => {
+  test("C", async () => {});
+});
`;
  assert.equal(scope(["tooling/visual/admin.spec.ts"], nested)["e2e:admin"].mode, "files");
  const importOnly = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -1,0 +2 @@ import AxeBuilder from "@axe-core/playwright";
+import { readFile } from "node:fs/promises";
`;
  assert.equal(scope(["tooling/visual/admin.spec.ts"], importOnly)["e2e:admin"].mode, "files");
});

test("e2e theo phạm vi: đổi chữ ký của test (dòng test( bị thay) vẫn chỉ grep test đó", () => {
  const signature = `diff --git a/tooling/visual/admin.spec.ts b/tooling/visual/admin.spec.ts
@@ -38 +38 @@ test.afterAll(() => fixture("cleanup"));
-test("products: CSV", async ({ page }) => {
+test("products: CSV", async ({ page }, info) => {
`;
  assert.equal(scope(["tooling/visual/admin.spec.ts"], signature)["e2e:admin"].grep, "products: CSV");
});

// PR #59 (E7-S10): apps/web/package.json chỉ thêm devDependency `@solar/storage: workspace:*` cho fixture e2e → 32 shard
// matrix + visual compare chạy vô ích. Link workspace tới package ngoài đầu vào của bộ ảnh chụp không đổi pixel nào.
const dirs = { "@solar/storage": "packages/storage/", "@solar/sections": "packages/sections/" };
const web = (dev) => JSON.stringify({ name: "web", dependencies: { next: "15.5.4" }, devDependencies: { tailwindcss: "3.4.17", ...dev } });

test("workspaceLinks: chỉ thêm/bớt/đổi link workspace → thư mục package; đổi khác → null", () => {
  assert.deepEqual(workspaceLinks(web({}), web({ "@solar/storage": "workspace:*" }), dirs), ["packages/storage/"]);
  assert.deepEqual(workspaceLinks(web({ "@solar/storage": "workspace:*" }), web({}), dirs), ["packages/storage/"]);
  assert.equal(workspaceLinks(web({}), web({ tailwindcss: "3.4.18" }).replace("3.4.17", "3.4.18"), dirs), null, "tailwind đổi pixel");
  assert.equal(workspaceLinks(web({}), web({ "@solar/storage": "workspace:*", "left-pad": "1.0.0" }), dirs), null);
  assert.equal(workspaceLinks(web({}), web({ "@solar/khac": "workspace:*" }), dirs), null, "package không rõ thư mục");
  const scripts = JSON.stringify({ ...JSON.parse(web({ "@solar/storage": "workspace:*" })), scripts: { dev: "next dev" } });
  assert.equal(workspaceLinks(web({}), scripts, dirs), null);
  assert.equal(workspaceLinks(undefined, web({}), dirs), null, "file mới");
  assert.equal(workspaceLinks("{", web({}), dirs), null, "JSON hỏng");
});

const e7s10 = ["apps/web/package.json", "apps/web/scripts/tenant-browser-fixture.ts", "pnpm-lock.yaml", "packages/storage/src/types.ts",
  "packages/db/src/tenantBackup.ts", "apps/admin/src/app/api/sao-luu/route.ts", "tooling/visual/tenant.spec.ts"];

test("E7-S10: link workspace ngoài matrix/visual không kéo bộ ảnh chụp; e2e và bộ khác giữ nguyên", () => {
  const checks = affectedChecks(e7s10, { links: { "apps/web/package.json": ["packages/storage/"] } });
  assert.ok(!checks.includes("matrix") && !checks.includes("visual"), checks.join());
  for (const name of ["db", "storage", "e2e:tenant", "e2e:admin"]) assert.ok(checks.includes(name), name);
  assert.ok(affectedChecks(e7s10).includes("matrix"), "không có thông tin link → giữ hành vi cũ");
  assert.ok(affectedChecks(["apps/web/package.json"], { links: { "apps/web/package.json": ["packages/sections/"] } }).includes("matrix"),
    "link tới package thuộc matrix vẫn chạy");
});
