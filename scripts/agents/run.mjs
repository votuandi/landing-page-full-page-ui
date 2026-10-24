#!/usr/bin/env node
// Việc cơ học của playbook /run-story — chạy bằng script để Claude chỉ đọc tóm tắt ngắn thay vì log dài.
//   node scripts/agents/run.mjs verify <ID> [--skip-checks]   → kiểm branch, commit, chạy checks, phạm vi file, AC
//   node scripts/agents/run.mjs commit <report.md> [--dry-run] → commit theo mục "Commit đề xuất" của báo cáo Codex
//   node scripts/agents/run.mjs pr-body <ID>                  → sinh .agent-runs/<ID>/pr-body.md, in tiêu đề PR
//   node scripts/agents/run.mjs stale <base>                  → chữ giao diện đã xóa mà test/spec vẫn dùng (sau design pass)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { affectedChecks, CHECKS, e2eScope, manifestLinks, specDiff } from "../ci/checks-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const IGNORED = /^(\.agent-runs\/|HANDOFF\.md$|\.env|codex\.log$)/;

const git = (...args) => execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);
/** File thay đổi chưa commit (không trim: cột trạng thái porcelain có thể bắt đầu bằng khoảng trắng). */
const dirtyFiles = () =>
  execFileSync("git", ["status", "--porcelain"], { cwd: process.cwd(), encoding: "utf8" })
    .split("\n").filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, "")).filter((f) => !IGNORED.test(f));
const storyInfo = (id) =>
  JSON.parse(execFileSync(process.execPath, [join(here, "story.mjs"), "info", id], { cwd: root, encoding: "utf8" }));
const tail = (text, n) => text.split("\n").slice(-n).join("\n");

/** Đường dẫn file nhắc tới trong plan (trong dấu `...`), dùng để phát hiện sửa ngoài phạm vi. */
function planPaths(planFile) {
  if (!existsSync(planFile)) return [];
  const text = readFileSync(planFile, "utf8");
  return [...text.matchAll(/`([\w.@\-/[\]]+\/[\w.@\-/[\]*]+|[\w-]+\.(?:json|md|ts|tsx|mjs|js|yaml|yml|toml))`/g)].map((m) => m[1]);
}

function inPlan(file, paths) {
  return paths.some((p) => {
    const prefix = p.replace(/\*.*$/, "").replace(/\/$/, "");
    return file === p || file.startsWith(prefix + "/") || (prefix && file.startsWith(prefix));
  });
}

/**
 * Cảnh báo chất lượng (không chặn): plan thiếu mục bắt buộc, report thiếu bằng chứng skill / case biên / tự review.
 * Xem roadmap/plans/README.md và solar-story-exec.
 */
function qualityWarnings(S) {
  const warnings = [];
  const section = (text, title) => text.match(new RegExp(`^## ${title}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"))?.[1]?.trim() ?? "";
  const planPath = join(root, S.planFile);
  if (existsSync(planPath)) {
    const plan = readFileSync(planPath, "utf8");
    for (const title of ["Yêu cầu → test", "Hạ tầng tái dùng", "Dữ liệu có sẵn chịu ảnh hưởng", "Case biên & bất biến", "Cách kiểm chứng"]) {
      if (!section(plan, title)) warnings.push(`Plan thiếu mục "## ${title}"`);
    }
  }
  const report = ["codex-report.md", "claude-report.md"].map((f) => join(root, S.runDir, f)).find(existsSync);
  if (!report) return [...warnings, "Chưa có codex-report.md / claude-report.md trong run dir"];
  const text = readFileSync(report, "utf8");
  const skills = section(text, "Skill đã dùng");
  if (!skills) warnings.push('Report thiếu mục "## Skill đã dùng"');
  else for (const skill of ["ponytail", "codegraph"]) if (!skills.includes(skill)) warnings.push(`Report không ghi đã dùng ${skill}`);
  if (!section(text, "Case biên → test")) warnings.push('Report thiếu mục "## Case biên → test"');
  if (!section(text, "Tự review")) warnings.push('Report thiếu mục "## Tự review" (bước 4.5 của /run-story)');
  const usage = skillUsage(S);
  if (usage.logs.length) {
    if (usage.missing.length) warnings.push(`Log Codex không thấy mở skill bắt buộc: ${usage.missing.join(", ")}`);
    if (usage.claimedNotOpened.length) warnings.push(`Report ghi đã dùng nhưng log Codex không thấy mở: ${usage.claimedNotOpened.join(", ")}`);
  }
  return warnings;
}

/**
 * Codex có thật sự dùng skill không: chỉ tính dòng lệnh trong log (dòng ngay sau "exec") mở
 * `.agents/skills/<tên>/SKILL.md`, hoặc chạy CLI `codegraph`. Chữ trong tài liệu Codex in ra không tính.
 */
function skillUsage(S) {
  // codex.sh giữ log mọi lượt (`<name>.log`, `<name>.1.log`, …) — gộp hết, không chỉ lượt cuối.
  const logs = readdirSyncSafe(join(root, S.runDir)).filter((f) => /^(codex-exec(-r\d+)?|fix-r\d+)(\.\d+)?\.log$/.test(f));
  const commands = logs.flatMap((f) => readFileSync(join(root, S.runDir, f), "utf8").split(/\r?\n/)
    .filter((_, i, all) => all[i - 1]?.trim() === "exec")).join("\n");
  const known = [...new Set([...Object.values(S.skills ?? {}).flatMap((v) => Array.isArray(v) ? v : Object.keys(v))])];
  const isOpened = (name) => name === "codegraph"
    ? /(?:^|[\s;'"])codegraph\s+(?:sync|init|explore|node|callers|impact|query|status)\b/m.test(commands)
    : new RegExp(`skills[\\\\/]+${name}[\\\\/]+SKILL\\.md`).test(commands);
  const opened = known.filter(isOpened);
  const required = [...new Set([...(S.skills?.exec ?? []), ...(S.skills?.selfReview ?? [])])];
  const report = ["codex-report.md"].map((f) => join(root, S.runDir, f)).find(existsSync);
  const listed = report ? (readFileSync(report, "utf8").match(/^## Skill đã dùng[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] ?? "") : "";
  const claimed = known.filter((name) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(listed));
  return { logs, required, opened, missing: required.filter((n) => !opened.includes(n)), claimedNotOpened: claimed.filter((n) => !opened.includes(n)) };
}
function readdirSyncSafe(dir) {
  try { return readdirSync(dir); } catch { return []; }
}

const gitOk = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const notTests = [":(exclude)**/__tests__/**", ":(exclude)**/*.test.*", ":(exclude)tooling/visual/**"];
/**
 * Chữ giao diện bị xóa khỏi source mà test/spec vẫn tìm (E7-S07: design pass đổi chữ, e2e cũ đỏ ở CI).
 * Chỉ xét chuỗi giống chữ người đọc (có dấu tiếng Việt hoặc viết hoa đầu, có khoảng trắng) để bỏ qua class/token.
 */
function staleTestStrings(base) {
  const diff = gitOk("diff", "-U0", `${base}...HEAD`, "--", "apps", "packages", ...notTests).stdout ?? "";
  const removed = new Set();
  for (const line of diff.split("\n")) {
    if (!line.startsWith("-") || line.startsWith("---")) continue;
    for (const m of line.matchAll(/"([^"\n]{6,80})"|`([^`$\n]{6,80})|>([^<>{}\n]{6,80})</g)) {
      const text = (m[1] ?? m[2] ?? m[3]).trim();
      if (/\s/.test(text) && /[À-ỹ]|^[A-ZÀ-Ỹ]/u.test(text)) removed.add(text);
    }
  }
  const stale = [];
  for (const text of removed) {
    if (gitOk("grep", "-qF", "-e", text, "--", "apps", "packages", ...notTests).status === 0) continue; // vẫn còn trong source
    const users = gitOk("grep", "-lF", "-e", text, "--", "tooling/visual", "**/__tests__/**", "**/*.test.*").stdout?.trim();
    if (users) stale.push(`"${text}" → ${users.split("\n").join(", ")}`);
  }
  return stale;
}

function verify(id, { skipChecks }) {
  const S = storyInfo(id);
  mkdirSync(S.runDir, { recursive: true });
  const problems = [];
  const branch = git("branch", "--show-current");
  if (branch !== S.branch) problems.push(`Đang ở branch "${branch}", cần "${S.branch}"`);

  const commits = lines(git("log", `${S.base}..HEAD`, "--format=%h %s"));
  if (commits.length === 0) problems.push("Chưa có commit nào so với base");
  const untagged = commits.filter((c) => !c.includes(`[${id}]`) && !c.includes(`${id} plan`));
  if (untagged.length) problems.push(`Commit thiếu [${id}]: ${untagged.join("; ")}`);

  const uncommitted = dirtyFiles();
  if (uncommitted.length) problems.push(`Còn file chưa commit: ${uncommitted.join(", ")}`);
  if (uncommitted.some((f) => f.startsWith("roadmap/evidence/"))) {
    problems.push("roadmap/evidence/ bị e2e ghi đè — story không cập nhật evidence thì chạy: git checkout -- roadmap/evidence");
  }
  const warnings = qualityWarnings(S);

  const changed = lines(git("diff", "--name-only", `${S.base}...HEAD`));
  for (const s of staleTestStrings(S.base)) problems.push(`Chữ đã xóa khỏi source nhưng test vẫn dùng: ${s}`);
  // Cùng bảng với CI (scripts/ci/checks-map.mjs): chạy hết trước khi push, ghi kết quả vào report "Lệnh kiểm tra".
  // Story thường: unit/int (db) + chỉ test e2e mới/sửa của story; story regression: mọi bộ toàn bộ.
  const full = S.regression?.due ?? false;
  const quote = (text) => `'${text.replace(/'/g, `'\\''`)}'`;
  const scope = e2eScope(changed, specDiff(S.base), { full });
  const requiredChecks = [
    ...(full ? Object.keys(CHECKS) : affectedChecks(changed, { links: manifestLinks(S.base, changed) })).filter((name) => !name.startsWith("e2e:") && CHECKS[name].cmd.startsWith("bash"))
      .map((name) => ({ name, cmd: CHECKS[name].cmd })),
    ...scope.filter((s) => s.mode !== "none").map((s) => ({ name: s.name, cmd: `${CHECKS[s.name].cmd}${
      s.mode === "grep" ? ` -g ${quote(s.grep)}` : s.mode === "files" ? ` ${s.files.map((f) => f.replace("tooling/visual/", "")).join(" ")}` : ""}` })),
  ];
  for (const s of scope.filter((x) => x.mode === "none")) {
    warnings.push(`Đổi code thuộc ${s.name} nhưng không có test e2e mới/sửa — code mới phải được cover bằng unit/int hoặc spec`);
  }
  const paths = planPaths(join(root, S.planFile));
  const outside = paths.length
    ? changed.filter((f) => !inPlan(f, paths) && f !== S.planFile && f !== S.epicFile)
    : [];

  const checks = [];
  if (!skipChecks) {
    let log = "";
    for (const cmd of S.checks) {
      const started = Date.now();
      const r = spawnSync(cmd, { shell: true, cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
      log += `\n===== ${cmd} (exit ${r.status}) =====\n${out}`;
      checks.push({ cmd, ok: r.status === 0, seconds: Math.round((Date.now() - started) / 1000), tail: r.status === 0 ? "" : tail(out, 40) });
    }
    writeFileSync(join(S.runDir, "checks.log"), log);
  }

  const fresh = storyInfo(id); // đọc lại để lấy AC đã tick trên branch hiện tại
  const result = {
    id,
    branch,
    sha: git("rev-parse", "--short", "HEAD"),
    requiredChecks,
    commits: commits.length,
    changedFiles: changed.length,
    outsidePlan: outside,
    ac: `${fresh.acDone}/${fresh.acTotal}`,
    checks: checks.map(({ cmd, ok, seconds }) => ({ cmd, ok, seconds })),
    problems,
    warnings,
    ok: problems.length === 0 && checks.every((c) => c.ok) && fresh.acDone === fresh.acTotal,
  };
  writeFileSync(join(S.runDir, "verify.json"), JSON.stringify(result, null, 2));

  // Tóm tắt ngắn cho Claude — log đầy đủ ở checks.log.
  console.log(`VERIFY ${result.ok ? "PASS" : "FAIL"} ${id} · branch ${branch} · ${commits.length} commit · ${changed.length} file · AC ${result.ac}`);
  for (const c of checks) console.log(`  ${c.ok ? "✔" : "✘"} ${c.cmd} (${c.seconds}s)`);
  if (full) console.log(`  ★ Story regression (${S.regression.since} PR đã merge từ lần trước): chạy mọi bộ toàn bộ + gắn nhãn PR "regression"`);
  if (requiredChecks.length) console.log(`  → Kiểm local bắt buộc (chạy trước push; trước đó: node scripts/agents/doctor.mjs):\n${requiredChecks.map((c) => `      ${c.name}: ${c.cmd}`).join("\n")}`);
  for (const p of problems) console.log(`  ! ${p}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  if (outside.length) console.log(`  ? Ngoài danh sách file của plan: ${outside.join(", ")}`);
  if (fresh.acDone !== fresh.acTotal) console.log(`  ! AC chưa tick đủ (${result.ac}) trong ${fresh.epicFile}`);
  for (const c of checks.filter((x) => !x.ok)) console.log(`\n--- ${c.cmd} (40 dòng cuối) ---\n${c.tail}`);
  process.exit(result.ok ? 0 : 1);
}

/** Đọc mục "## Commit đề xuất": `1. \`msg\`` rồi các dòng `- path`. */
function parseProposals(reportPath) {
  const text = readFileSync(reportPath, "utf8").replace(/\r\n/g, "\n");
  const section = text.split(/^## Commit đề xuất\s*$/m)[1]?.split(/^## /m)[0];
  if (!section) throw new Error(`Không thấy mục "## Commit đề xuất" trong ${reportPath}`);
  const proposals = [];
  for (const line of section.split("\n")) {
    const msg = line.match(/^\s*\d+\.\s*`(.+)`\s*$/);
    if (msg) proposals.push({ message: msg[1], files: [] });
    // Cho phép chú thích sau đường dẫn: "- `a/b.ts` (mới)" — trước đây làm rơi file mới khỏi commit (E6-S04).
    const file = line.match(/^\s+[-*]\s+`?([^`\s]+)`?(?:\s.*)?$/);
    if (file && proposals.length) proposals.at(-1).files.push(file[1]);
  }
  return proposals.filter((p) => p.files.length);
}

function commit(reportPath, { dryRun }) {
  const proposals = parseProposals(reportPath);
  if (!proposals.length) throw new Error("Không có commit đề xuất nào kèm danh sách file");
  for (const p of proposals) {
    if (dryRun) {
      console.log(`[dry-run] ${p.message}\n  ${p.files.join("\n  ")}`);
      continue;
    }
    git("add", "-A", "--", ...p.files);
    if (!git("diff", "--cached", "--name-only")) {
      console.log(`  - bỏ qua (không có thay đổi): ${p.message}`);
      continue;
    }
    git("commit", "-q", "-m", p.message, "-m", "Co-Authored-By: Codex <noreply@openai.com>");
    console.log(`  ✔ ${git("log", "-1", "--format=%h")} ${p.message}`);
  }
  if (dryRun) return;
  const left = dirtyFiles();
  if (left.length) {
    console.log(`  ! File thay đổi không thuộc commit đề xuất nào: ${left.join(", ")}`);
    process.exit(2);
  }
}

function prBody(id) {
  const S = storyInfo(id);
  const report = ["codex-report.md", "claude-report.md"].map((f) => join(S.runDir, f)).find(existsSync);
  const reportText = report ? readFileSync(report, "utf8").replace(/\r\n/g, "\n") : "";
  const section = (name) => reportText.split(new RegExp(`^## ${name}\\s*$`, "m"))[1]?.split(/^## /m)[0]?.trim() ?? "_(không có)_";
  const verifyFile = join(S.runDir, "verify.json");
  const v = existsSync(verifyFile) ? JSON.parse(readFileSync(verifyFile, "utf8")) : null;
  const who = S.mode === "split" ? "codex (dựng) + claude (design pass)" : S.author;
  const title = `${S.commitType}: [${id}] ${S.title}`.replace(/`/g, "").slice(0, 90);
  const body = `## Story

- ID: [${id}] — ${S.title}
- Story: \`${S.epicFile}\` · Plan: \`${S.planFile}\`
- Người viết: ${who} · Reviewer: ${S.reviewer}
${S.selfReviewConflict ? "\n> ⚠️ Reviewer cùng loại agent với người viết — tự review ở phiên độc lập, chế độ kiểm kỹ.\n" : ""}
## AC → bằng chứng

${section("AC → bằng chứng")}

## Kiểm tra (Claude chạy lại)

${v ? v.checks.map((c) => `- ${c.ok ? "✅" : "❌"} \`${c.cmd}\` (${c.seconds}s)`).join("\n") + `\n- AC đã tick: ${v.ac} · ${v.commits} commit · ${v.changedFiles} file` : "_chưa chạy verify_"}
${v?.outsidePlan?.length ? `- File ngoài danh sách của plan: ${v.outsidePlan.map((f) => `\`${f}\``).join(", ")}` : ""}
${v?.requiredChecks?.length ? `- Kiểm local bắt buộc theo phạm vi story (SHA ${v.sha}; kết quả ở report "Lệnh kiểm tra"): ${v.requiredChecks.map((c) => `\`${c.name}\``).join(", ")}` : ""}

## Lệch so với plan

${section("Lệch so với plan")}

## Kết quả review

_Chờ reviewer theo policy; ghi verdict, SHA cuối, vòng sửa và tóm tắt hoặc đính kèm bằng chứng review/checks trong PR._

## Checklist DoD (AGENTS.md §7)

- [${v?.ok ? "x" : " "}] Mọi AC đạt và có bằng chứng
- [ ] typecheck · lint · test qua, có bằng chứng lệnh/exit code
- [ ] Build qua khi buildPolicy yêu cầu (regression: story đến lượt regression; CI build package đổi mọi PR)
- [ ] \`lint:tokens\` qua sau E2; ảnh 390/1440 cho story UI
- [ ] Có test cho logic mới và e2e cho luồng người dùng phù hợp
- [ ] Review theo policy trên SHA cuối; mọi finding P0/P1 đã xử lý
- [ ] Tài liệu/roadmap cập nhật nếu hành vi thay đổi
- [ ] Không hard-code style; truy vấn có \`tenantId\`; entitlement phía server
- [ ] Dependency mới có lý do trong PR

🤖 Generated with [Claude Code](https://claude.com/claude-code)
`;
  writeFileSync(join(S.runDir, "pr-body.md"), body);
  console.log(JSON.stringify({ title, bodyFile: `${S.runDir}/pr-body.md`, base: S.base, head: S.branch }));
}

const [cmd, arg, ...rest] = process.argv.slice(2);
try {
  if (cmd === "verify" && arg) verify(arg.toUpperCase(), { skipChecks: rest.includes("--skip-checks") });
  else if (cmd === "commit" && arg) commit(arg, { dryRun: rest.includes("--dry-run") });
  else if (cmd === "pr-body" && arg) prBody(arg.toUpperCase());
  else if (cmd === "skills" && arg) console.log(JSON.stringify(skillUsage(storyInfo(arg.toUpperCase()))));
  else if (cmd === "stale" && arg) { const s = staleTestStrings(arg); console.log(s.join("\n")); process.exit(s.length ? 1 : 0); }
  else {
    console.error("Dùng: run.mjs verify <ID> [--skip-checks] | commit <report.md> [--dry-run] | pr-body <ID> | skills <ID> | stale <base>");
    process.exit(1);
  }
} catch (err) {
  console.error(`LỖI: ${err.message}`);
  process.exit(1);
}
