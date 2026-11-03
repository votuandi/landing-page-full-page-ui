#!/usr/bin/env node
// Push thêm vào PR chỉ đổi tài liệu (*.md) sau một lần chạy xanh của cùng workflow → dùng lại kết quả đó, bỏ job nặng.
// checks-map.mjs không tính *.md, nhưng nó chọn job theo diff cả PR so với base, nên mọi push đều chạy lại cả phạm vi PR
// (PR #80: commit tick AC một dòng chạy lại admin/db/thumbnails/verify ≈ 21 phút runner, không thêm thông tin).
//   node scripts/ci/reuse-run.mjs <file workflow>   env: ACTION, BEFORE, AFTER, GH_TOKEN; ghi `reuse=true|false` vào GITHUB_OUTPUT
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const docsOnly = (files) => files.length > 0 && files.every((file) => file.endsWith(".md"));
/**
 * Chỉ `synchronize` (push thêm), BEFORE là tổ tiên của AFTER (không force-push), phần mới chỉ *.md, và lần chạy mới nhất
 * của cùng workflow trên BEFORE đã xong và `success` (lần đó tự dùng lại cũng tính: nó chỉ xanh khi lần trước nó xanh).
 */
export function reusable({ action, ancestor, files, runs }) {
  if (action !== "synchronize" || !ancestor || !docsOnly(files)) return false;
  return runs[0]?.status === "completed" && runs[0]?.conclusion === "success";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const workflow = process.argv[2];
  const { ACTION = "", BEFORE = "", AFTER = "HEAD" } = process.env;
  const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  let input = { action: ACTION, ancestor: false, files: [], runs: [] };
  try {
    run("git", ["merge-base", "--is-ancestor", BEFORE, AFTER]);
    input.ancestor = true;
    input.files = run("git", ["diff", "--name-only", BEFORE, AFTER]).split(/\r?\n/).filter(Boolean);
    if (ACTION === "synchronize" && docsOnly(input.files)) {
      input.runs = JSON.parse(run("gh", ["run", "list", "--workflow", workflow, "--commit", BEFORE, "--limit", "1", "--json", "status,conclusion"]));
    }
  } catch (error) {
    // Thiếu commit (fork, force-push), gh lỗi → chạy đủ như bình thường.
    console.log(`Không dùng lại: ${String(error.stderr || error.message).split("\n")[0]}`);
  }
  const reuse = reusable(input);
  console.log(`reuse=${reuse} · ${ACTION} ${BEFORE.slice(0, 7)}..${AFTER.slice(0, 7)} · ${input.files.length} file · lần trước: ${JSON.stringify(input.runs[0] ?? null)}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `reuse=${reuse}\n`);
}
