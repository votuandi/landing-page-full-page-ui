#!/usr/bin/env node
// File đổi → bộ kiểm bắt buộc. Một bảng cho cả CI (workspace.yml, visual.yml: chọn job + test) và /run-story
// (run.mjs verify in ra các bộ kiểm local phải chạy trước khi push). Khớp tiền tố đường dẫn; `except` loại trừ.
//   node scripts/ci/checks-map.mjs <base-ref>                  → in tên bộ kiểm, mỗi dòng một bộ
//   git diff --name-only A B | node scripts/ci/checks-map.mjs --stdin   → như trên, danh sách file từ stdin
//   node scripts/ci/checks-map.mjs <base-ref> --github-output [--full] → `<tên>=true|false` (bỏ `e2e:`) + `<bộ>_e2e/_grep/_files`
// Tài liệu (*.md) và unit test không kích hoạt bộ nào. Đổi đầu vào của một bộ → sửa bảng này, test ở checks-map.test.mjs.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const shared = ["pnpm-lock.yaml", "package.json", "pnpm-workspace.yaml", "scripts/ci/checks-map.mjs"];
const web = "apps/web/src/";
export const CHECKS = {
  // Section lab /lab/sections × 15 theme × 4 viewport (CI: Visual regression / matrix, 32 shard).
  matrix: {
    cmd: "CI: Visual regression / matrix",
    // Không tính pnpm-lock.yaml: đổi dependency luôn kèm package.json của package dùng nó (đã nằm trong các tiền tố dưới);
    // lockfile đổi riêng thường là workspace link của package ngoài matrix (vd. cms-ui ở E6-S04).
    // Không tính scripts/ci/checks-map.mjs: sửa bảng không đổi pixel nào (E8-S01 thêm bộ storage kéo 32 shard vô ích).
    paths: ["package.json", "pnpm-workspace.yaml", "packages/sections/", "packages/themes/", "packages/tokens/", "packages/ui/", "packages/core/",
      "packages/config/", "packages/presets/", `${web}app/(site)/lab/sections/`, `${web}app/(site)/lab/layout.tsx`,
      `${web}app/(site)/layout.tsx`, `${web}app/layout.tsx`, `${web}app/globals.css`, `${web}components/`, `${web}config/`,
      `${web}i18n/`, `${web}lib/`, `${web}data/`, "apps/web/public/", "apps/web/tailwind.config.ts", "apps/web/postcss.config.mjs",
      "apps/web/next.config.ts", "apps/web/package.json", "tooling/visual/matrix", "tooling/visual/playwright.matrix.config.ts",
      "tooling/visual/package.json", ".github/workflows/visual.yml", "scripts/ci/visual-baseline-run.sh"],
    // Layout chỉ đọc dữ liệu preset t15; bộ kiểm cấu trúc trang không ảnh hưởng ảnh chụp.
    except: [`${web}lib/tenant/`, `${web}components/tenant/`, "packages/presets/src/structure.ts"],
    // package.json chỉ đổi link workspace tới package ngoài `paths` không đổi pixel (PR #59: @solar/storage cho fixture e2e).
    ignoreLinks: true,
  },
  // Ảnh chụp các trang công khai của t15 (CI: Visual regression / compare). Spec e2e đổi không kéo bộ này.
  visual: {
    cmd: "CI: Visual regression / compare",
    paths: ["package.json", "pnpm-workspace.yaml", "packages/sections/", "packages/themes/", "packages/tokens/",
      "packages/ui/", "packages/core/", "packages/config/", "packages/presets/", `${web}app/(site)/`, `${web}app/layout.tsx`, `${web}app/globals.css`,
      `${web}components/`, `${web}config/`, `${web}i18n/`, `${web}lib/`, `${web}data/`, "apps/web/public/", "apps/web/tailwind.config.ts",
      "apps/web/postcss.config.mjs", "apps/web/next.config.ts", "apps/web/package.json", "tooling/visual/visual.spec.ts", "tooling/visual/routes.ts",
      "tooling/visual/playwright.config.ts", "tooling/visual/package.json", ".github/workflows/visual.yml"],
    except: [`${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/(site)/lab/`, "packages/presets/src/structure.ts"],
    ignoreLinks: true,
  },
  db: {
    cmd: "bash scripts/local-ci.sh db",
    paths: [...shared, "packages/db/", "packages/plans/", "packages/presets/", "packages/sections/", "packages/cache/",
      "packages/auth/", "packages/platform/", `${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/sites/`, "apps/admin/src/"],
  },
  storage: {
    cmd: "bash scripts/local-ci.sh storage",
    paths: [...shared, "packages/storage/", "scripts/local-ci.sh", ".github/workflows/workspace.yml"],
  },
  "e2e:tenant": {
    cmd: "bash scripts/local-ci.sh e2e tenant",
    paths: [...shared, "apps/web/", "packages/db/prisma/", "packages/db/src/", "packages/plans/", "packages/presets/",
      "packages/themes/", "packages/sections/", "packages/tokens/", "packages/ui/", "packages/cache/", "tooling/visual/tenant.spec.ts",
      "tooling/visual/playwright.tenant.config.ts"],
    except: [`${web}app/(site)/lab/`],
    specs: ["tooling/visual/tenant.spec.ts"],
  },
  "e2e:production": {
    cmd: "bash scripts/local-ci.sh e2e production",
    paths: [...shared, `${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/sites/`, `${web}app/api/`, "apps/web/next.config.ts",
      "packages/cache/", "tooling/visual/production.spec.ts", "tooling/visual/playwright.production.config.ts"],
    specs: ["tooling/visual/production.spec.ts"],
  },
  "e2e:preview": {
    cmd: "bash scripts/local-ci.sh e2e preview --project=chromium",
    paths: [...shared, `${web}lib/tenant/`, `${web}components/tenant/`, `${web}app/sites/`, `${web}app/api/`, "packages/db/src/",
      "packages/cache/", "apps/admin/src/lib/previewUrl.ts", "tooling/visual/preview.spec.ts", "tooling/visual/playwright.preview.config.ts"],
    specs: ["tooling/visual/preview.spec.ts"],
  },
  "e2e:admin": {
    cmd: "bash scripts/local-ci.sh e2e admin",
    paths: [...shared, "apps/admin/", "packages/cms-ui/", "packages/auth/", "packages/db/", "packages/plans/", "packages/platform/",
      "packages/ui/", "packages/tokens/", "packages/themes/", "tooling/visual/admin.spec.ts", "tooling/visual/playwright.admin.config.ts"],
    specs: ["tooling/visual/admin.spec.ts"],
  },
  "e2e:sections": {
    cmd: "bash scripts/local-ci.sh e2e sections",
    paths: [...shared, "packages/cms-ui/", "packages/sections/", "packages/ui/", `${web}app/(site)/lab/`, "tooling/visual/cms-",
      "tooling/visual/fields.spec.ts", "tooling/visual/renderer.spec.ts", "tooling/visual/content.spec.ts", "tooling/visual/widgets.spec.ts",
      "tooling/visual/playwright.sections.config.ts"],
    // Khớp testMatch của playwright.sections.config.ts.
    specs: ["sections-bundle", "fields", "renderer", "conversion", "content", "premium", "widgets", "preset-home", "t11", "cms-form",
      "cms-sections", "cms-content"].map((name) => `tooling/visual/${name}.spec.ts`),
  },
};

const hit = (file, prefixes = []) => prefixes.some((p) => file === p || file.startsWith(p));
/**
 * Tên các bộ kiểm cần chạy cho danh sách file đổi. `links`: package.json → thư mục các package workspace mà nó chỉ
 * thêm/bớt/đổi link (từ `workspaceLinks`); bộ có `ignoreLinks` bỏ qua file đó khi mọi package được link nằm ngoài bộ.
 */
export function affectedChecks(files, { links = {} } = {}) {
  // Tài liệu và unit test không đổi kết quả e2e/ảnh chụp (unit test đã chạy trong verify).
  const code = files.map((f) => f.replace(/\\/g, "/")).filter((f) => !f.endsWith(".md") && !/\/__tests__\/|\.test\.[cm]?[jt]sx?$/.test(f));
  const counts = (f, c) => hit(f, c.paths) && !hit(f, c.except) && !(c.ignoreLinks && links[f]?.every((dir) => !hit(dir, c.paths)));
  return Object.entries(CHECKS).filter(([, c]) => code.some((f) => counts(f, c))).map(([name]) => name);
}

const DEPS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
/**
 * Hai bản package.json chỉ khác nhau ở link `workspace:` → thư mục các package đó (theo `dirs`: tên → thư mục);
 * còn đổi gì khác (phiên bản thư viện ngoài, scripts…), file mới, JSON hỏng hoặc package không rõ thư mục → null.
 */
export function workspaceLinks(before, after, dirs) {
  let a, b;
  try { a = JSON.parse(before); b = JSON.parse(after); } catch { return null; }
  const names = new Set();
  const strip = (pkg) => ({ ...pkg, ...Object.fromEntries(DEPS.filter((k) => pkg[k]).map((k) => [k,
    Object.fromEntries(Object.entries(pkg[k]).filter(([name, version]) => !(String(version).startsWith("workspace:") && names.add(name))))])) });
  const [sa, sb] = [strip(a), strip(b)];
  const sorted = (pkg) => JSON.stringify(pkg, (_, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
  if (sorted(sa) !== sorted(sb)) return null;
  const changed = [...names].filter((n) => DEPS.some((k) => a[k]?.[n] !== b[k]?.[n]));
  return changed.length && changed.every((n) => dirs[n]) ? changed.map((n) => dirs[n]) : null;
}
/** Tên → thư mục của mọi package trong workspace (apps/*, packages/*, tooling/*). */
function workspaceDirs() {
  const dirs = {};
  for (const group of ["apps", "packages", "tooling"]) {
    for (const dir of existsSync(group) ? readdirSync(group) : []) {
      const manifest = `${group}/${dir}/package.json`;
      if (existsSync(manifest)) dirs[JSON.parse(readFileSync(manifest, "utf8")).name] = `${group}/${dir}/`;
    }
  }
  return dirs;
}
/** `links` cho affectedChecks: package.json đổi so với base (merge-base, như `base...HEAD`) chỉ ở link workspace. */
export function manifestLinks(base, files) {
  const show = (ref, file) => { try { return execFileSync("git", ["show", `${ref}:${file}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return undefined; } };
  const manifests = files.map((f) => f.replace(/\\/g, "/")).filter((f) => f.endsWith("package.json"));
  if (!manifests.length) return {};
  const from = execFileSync("git", ["merge-base", base, "HEAD"], { encoding: "utf8" }).trim(), dirs = workspaceDirs();
  return Object.fromEntries(manifests.map((f) => [f, workspaceLinks(show(from, f), show("HEAD", f), dirs)]).filter(([, dirsOf]) => dirsOf));
}

const TEST_TITLE = /^test\(\s*(["'`])((?:\\.|(?!\1).)*)\1/;
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** `git diff -U0` của spec → { file: { titles, whole } }: test nào bị thêm/sửa; whole khi đổi ngoài thân test (hook, helper). */
function changedTests(diff) {
  const result = {};
  let file, current;
  for (const line of diff.split(/\r?\n/)) {
    const header = /^diff --git a\/\S+ b\/(\S+)/.exec(line);
    if (header) { file = result[header[1]] = { titles: new Set(), whole: false }; continue; }
    const hunk = /^@@ [^@]+ @@ ?(.*)$/.exec(line);
    if (hunk) { current = TEST_TITLE.exec(hunk[1])?.[2]; continue; }
    if (!file || !/^[+-]/.test(line) || /^(\+\+\+|---) /.test(line)) continue;
    const code = line.slice(1);
    // Dòng trống và import không thuộc test nào; spec chạy theo test dùng chúng.
    if (!code.trim() || /^import\s/.test(code)) continue;
    // Dòng `test("…"` bị xóa/thêm (đổi chữ ký, đổi tên): tên đó là test đang sửa; tên cũ không khớp test nào thì vô hại.
    const title = TEST_TITLE.exec(code)?.[2];
    if (title) current = title;
    // Dòng cấp file khác `test(` (const/helper, test.describe, hook) ảnh hưởng nhiều test; `});` vẫn thuộc test đang mở.
    else if (/^\S/.test(code) && !/^[)}\];,]+$/.test(code.trim())) current = undefined;
    if (current) file.titles.add(current);
    else file.whole = true;
  }
  return result;
}
/**
 * Phạm vi e2e của story: mỗi bộ e2e bị ảnh hưởng chỉ chạy test mới/sửa (`grep`), cả file spec khi đổi ngoài thân test
 * (`files`), hoặc không chạy khi story không đổi spec của bộ đó (`none` — code mới phải có unit/int hoặc spec).
 * Story đến lượt regression (`full`) chạy mọi bộ e2e toàn bộ.
 */
export function e2eScope(files, diff, { full = false } = {}) {
  const suites = Object.entries(CHECKS).filter(([name]) => name.startsWith("e2e:"));
  if (full) return suites.map(([name]) => ({ name, mode: "full" }));
  const affected = affectedChecks(files), tests = changedTests(diff);
  return suites.filter(([name]) => affected.includes(name)).map(([name, check]) => {
    const specs = check.specs.filter((spec) => tests[spec]);
    if (!specs.length) return { name, mode: "none" };
    // Chỉ đổi import (không test nào) cũng chạy cả file: không bao giờ grep rỗng (= chạy cả bộ).
    if (specs.some((spec) => tests[spec].whole || !tests[spec].titles.size)) return { name, mode: "files", files: specs };
    return { name, mode: "grep", grep: [...new Set(specs.flatMap((spec) => [...tests[spec].titles]))].map(escapeRegex).join("|") };
  });
}
/** Diff -U0 của mọi spec e2e so với base (đầu vào của e2eScope). */
export const specDiff = (base) => execFileSync("git", ["diff", "-U0", `${base}...HEAD`, "--", "tooling/visual/*.spec.ts"], { encoding: "utf8" });

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [base, flag, ...rest] = process.argv.slice(2);
  if (!base) { console.error("Dùng: checks-map.mjs <base-ref>|--stdin [--github-output [--full]]"); process.exit(1); }
  const files = (base === "--stdin" ? readFileSync(0, "utf8")
    : execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" })).split(/\r?\n/).filter(Boolean);
  const full = rest.includes("--full");
  const names = full ? Object.keys(CHECKS) : affectedChecks(files, { links: base === "--stdin" ? {} : manifestLinks(base, files) });
  if (flag === "--github-output") {
    // `<bộ>=true|false` (bộ bị ảnh hưởng) + với e2e: `<bộ>_e2e`, `<bộ>_grep`, `<bộ>_files` cho bước playwright.
    const scope = Object.fromEntries(e2eScope(files, base === "--stdin" ? "" : specDiff(base), { full }).map((s) => [s.name, s]));
    const out = Object.keys(CHECKS).flatMap((n) => {
      const key = n.replace(/^e2e:/, ""), s = scope[n];
      return [`${key}=${names.includes(n)}`, ...(n.startsWith("e2e:")
        ? [`${key}_e2e=${Boolean(s && s.mode !== "none")}`, `${key}_grep=${s?.grep ?? ""}`, `${key}_files=${s?.files?.join(" ") ?? ""}`] : [])];
    }).join("\n");
    appendFileSync(process.env.GITHUB_OUTPUT, `${out}\n`);
    console.log(out);
  } else console.log(names.join("\n"));
}
