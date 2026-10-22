#!/usr/bin/env node
// File đổi → bộ kiểm bắt buộc. Một bảng cho cả CI (visual.yml: có chạy matrix không) và /run-story
// (run.mjs verify in ra các bộ kiểm local phải chạy trước khi push). Khớp tiền tố đường dẫn; `except` loại trừ.
//   node scripts/ci/checks-map.mjs <base-ref>                  → in tên bộ kiểm, mỗi dòng một bộ
//   git diff --name-only A B | node scripts/ci/checks-map.mjs --stdin   → như trên, danh sách file từ stdin
//   node scripts/ci/checks-map.mjs <base-ref> --github-output   → ghi `<tên>=true|false` vào $GITHUB_OUTPUT (bỏ `e2e:`)
// Tài liệu (*.md) và unit test không kích hoạt bộ nào. Đổi đầu vào của một bộ → sửa bảng này, test ở checks-map.test.mjs.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const shared = ["pnpm-lock.yaml", "package.json", "pnpm-workspace.yaml", "scripts/ci/checks-map.mjs"];
const web = "apps/web/src/";
export const CHECKS = {
  // Section lab /lab/sections × 15 theme × 4 viewport (CI: Visual regression / matrix, 32 shard).
  matrix: {
    cmd: "CI: Visual regression / matrix",
    // Không tính pnpm-lock.yaml: đổi dependency luôn kèm package.json của package dùng nó (đã nằm trong các tiền tố dưới);
    // lockfile đổi riêng thường là workspace link của package ngoài matrix (vd. cms-ui ở E6-S04).
    paths: ["package.json", "pnpm-workspace.yaml", "scripts/ci/checks-map.mjs", "packages/sections/", "packages/themes/", "packages/tokens/", "packages/ui/", "packages/core/",
      "packages/config/", "packages/presets/", `${web}app/(site)/lab/sections/`, `${web}app/(site)/lab/layout.tsx`,
      `${web}app/(site)/layout.tsx`, `${web}app/layout.tsx`, `${web}app/globals.css`, `${web}components/`, `${web}config/`,
      `${web}i18n/`, `${web}lib/`, `${web}data/`, "apps/web/public/", "apps/web/tailwind.config.ts", "apps/web/postcss.config.mjs",
      "apps/web/next.config.ts", "apps/web/package.json", "tooling/visual/matrix", "tooling/visual/playwright.matrix.config.ts",
      "tooling/visual/package.json", ".github/workflows/visual.yml", "scripts/ci/visual-baseline-run.sh"],
    // Layout chỉ đọc dữ liệu preset t15; bộ kiểm cấu trúc trang không ảnh hưởng ảnh chụp.
    except: [`${web}lib/tenant/`, `${web}components/tenant/`, "packages/presets/src/structure.ts"],
  },
  db: {
    cmd: "bash scripts/local-ci.sh db",
    paths: [...shared, "packages/db/", "packages/plans/", "packages/presets/", "packages/sections/", "packages/cache/",
      "packages/auth/", "packages/platform/", `${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/sites/`, "apps/admin/src/"],
  },
  "e2e:tenant": {
    cmd: "bash scripts/local-ci.sh e2e tenant",
    paths: [...shared, "apps/web/", "packages/db/prisma/", "packages/db/src/", "packages/plans/", "packages/presets/",
      "packages/themes/", "packages/sections/", "packages/tokens/", "packages/ui/", "packages/cache/", "tooling/visual/tenant.spec.ts",
      "tooling/visual/playwright.tenant.config.ts"],
    except: [`${web}app/(site)/lab/`],
  },
  "e2e:preview": {
    cmd: "bash scripts/local-ci.sh e2e preview --project chromium",
    paths: [...shared, `${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/sites/`, `${web}app/api/`, "packages/db/src/",
      "packages/cache/", "apps/admin/src/lib/previewUrl.ts", "tooling/visual/preview.spec.ts", "tooling/visual/playwright.preview.config.ts"],
  },
  "e2e:admin": {
    cmd: "bash scripts/local-ci.sh e2e admin",
    paths: [...shared, "apps/admin/", "packages/cms-ui/", "packages/auth/", "packages/db/", "packages/plans/", "packages/platform/",
      "packages/ui/", "packages/tokens/", "packages/themes/", "tooling/visual/admin.spec.ts", "tooling/visual/playwright.admin.config.ts"],
  },
  "e2e:sections": {
    cmd: "bash scripts/local-ci.sh e2e sections",
    paths: [...shared, "packages/cms-ui/", "packages/sections/", "packages/ui/", `${web}app/(site)/lab/`, "tooling/visual/cms-",
      "tooling/visual/fields.spec.ts", "tooling/visual/renderer.spec.ts", "tooling/visual/content.spec.ts", "tooling/visual/widgets.spec.ts",
      "tooling/visual/playwright.sections.config.ts"],
  },
};

const hit = (file, prefixes = []) => prefixes.some((p) => file === p || file.startsWith(p));
/** Tên các bộ kiểm cần chạy cho danh sách file đổi. */
export function affectedChecks(files) {
  // Tài liệu và unit test không đổi kết quả e2e/ảnh chụp (unit test đã chạy trong verify).
  const code = files.map((f) => f.replace(/\\/g, "/")).filter((f) => !f.endsWith(".md") && !/\/__tests__\/|\.test\.[cm]?[jt]sx?$/.test(f));
  return Object.entries(CHECKS).filter(([, c]) => code.some((f) => hit(f, c.paths) && !hit(f, c.except))).map(([name]) => name);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [base, flag] = process.argv.slice(2);
  if (!base) { console.error("Dùng: checks-map.mjs <base-ref>|--stdin [--github-output]"); process.exit(1); }
  const files = (base === "--stdin" ? readFileSync(0, "utf8")
    : execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" })).split(/\r?\n/).filter(Boolean);
  const names = affectedChecks(files);
  if (flag === "--github-output") {
    const out = Object.keys(CHECKS).map((n) => `${n.replace(/^e2e:/, "")}=${names.includes(n)}`).join("\n");
    appendFileSync(process.env.GITHUB_OUTPUT, `${out}\n`);
    console.log(out);
  } else console.log(names.join("\n"));
}
