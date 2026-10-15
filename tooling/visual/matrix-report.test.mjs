import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("report đánh dấu AA, ngoài token, thiếu ô, lỗi lượt chạy và escape chi tiết", async () => {
  const directory = await mkdtemp(join(tmpdir(), "matrix-report-"));
  await mkdir(join(directory, "test-results/matrix/one"), { recursive: true });
  await writeFile(join(directory, "test-results/matrix-run.json"), JSON.stringify({
    stats: { duration: 1250, expected: 2, unexpected: 1, skipped: 0 },
  }));
  const cell = { type: "hero", variant: "t15", theme: "t15", mode: "light", viewport: 390,
    offToken: [], contrast: [{ id: "color-contrast", nodes: [{ target: ["<script>bad</script>"] }] }], incomplete: [] };
  await writeFile(join(directory, "test-results/matrix/one/cells.json"), JSON.stringify([
    cell, { ...cell, type: "faq", mode: "dark", contrast: [], offToken: [{ value: "rgb(255, 0, 0)" }] },
  ]));
  execFileSync(process.execPath, [fileURLToPath(new URL("./matrix-report.mjs", import.meta.url))], { cwd: directory });
  const html = await readFile(join(directory, "matrix-report/index.html"), "utf8");
  for (const text of ['class="contrast"', 'class="off-token"', "Thiếu kết quả", "1.25 giây", "1 lỗi", "mục tiêu ≥ 4 theme", "&lt;script&gt;"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("<script>bad</script>"));
});

test("report retains partial cells when the runner is interrupted before its JSON reporter finishes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "matrix-interrupted-"));
  await mkdir(join(directory, "test-results/matrix/one"), { recursive: true });
  await writeFile(join(directory, "test-results/matrix/one/cells.json"), JSON.stringify([
    { type: "page-hero", variant: "t15", theme: "t15", mode: "light", viewport: 390, offToken: [], contrast: [], incomplete: [] },
  ]));
  execFileSync(process.execPath, [fileURLToPath(new URL("./matrix-report.mjs", import.meta.url))], { cwd: directory });
  const html = await readFile(join(directory, "matrix-report/index.html"), "utf8");
  assert.ok(html.includes("Lượt chạy bị ngắt"));
  assert.ok(html.includes("page-hero/t15"));
});
