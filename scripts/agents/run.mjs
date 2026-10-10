#!/usr/bin/env node
// Việc cơ học của playbook /run-story — chạy bằng script để Claude chỉ đọc tóm tắt ngắn thay vì log dài.
//   node scripts/agents/run.mjs verify <ID> [--skip-checks]   → kiểm branch, commit, chạy checks, phạm vi file, AC
//   node scripts/agents/run.mjs commit <report.md> [--dry-run] → commit theo mục "Commit đề xuất" của báo cáo Codex
//   node scripts/agents/run.mjs pr-body <ID>                  → sinh .agent-runs/<ID>/pr-body.md, in tiêu đề PR
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

  const changed = lines(git("diff", "--name-only", `${S.base}...HEAD`));
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
    commits: commits.length,
    changedFiles: changed.length,
    outsidePlan: outside,
    ac: `${fresh.acDone}/${fresh.acTotal}`,
    checks: checks.map(({ cmd, ok, seconds }) => ({ cmd, ok, seconds })),
    problems,
    ok: problems.length === 0 && checks.every((c) => c.ok) && fresh.acDone === fresh.acTotal,
  };
  writeFileSync(join(S.runDir, "verify.json"), JSON.stringify(result, null, 2));

  // Tóm tắt ngắn cho Claude — log đầy đủ ở checks.log.
  console.log(`VERIFY ${result.ok ? "PASS" : "FAIL"} ${id} · branch ${branch} · ${commits.length} commit · ${changed.length} file · AC ${result.ac}`);
  for (const c of checks) console.log(`  ${c.ok ? "✔" : "✘"} ${c.cmd} (${c.seconds}s)`);
  for (const p of problems) console.log(`  ! ${p}`);
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
    const file = line.match(/^\s+[-*]\s+`?([^`\s]+)`?\s*$/);
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
  const left = dirtyFiles();
  if (left.length && !dryRun) {
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

## Lệch so với plan

${section("Lệch so với plan")}

## Kết quả review

_Chờ reviewer theo policy; ghi verdict, SHA cuối, vòng sửa và tóm tắt hoặc đính kèm bằng chứng review/checks trong PR._

## Checklist DoD (AGENTS.md §7)

- [${v?.ok ? "x" : " "}] Mọi AC đạt và có bằng chứng
- [ ] typecheck · lint · test qua, có bằng chứng lệnh/exit code
- [ ] Build qua khi buildPolicy yêu cầu (epic-last: story cuối epic; CI build mọi PR)
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
  else {
    console.error("Dùng: run.mjs verify <ID> [--skip-checks] | commit <report.md> [--dry-run] | pr-body <ID>");
    process.exit(1);
  }
} catch (err) {
  console.error(`LỖI: ${err.message}`);
  process.exit(1);
}
