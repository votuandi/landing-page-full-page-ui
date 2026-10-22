import assert from "node:assert/strict";
import test from "node:test";
import { affectedChecks } from "./checks-map.mjs";

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
