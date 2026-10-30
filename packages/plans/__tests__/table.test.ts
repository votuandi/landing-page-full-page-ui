import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { renderTable, replaceTable, runTable } from "../scripts/table";

const start = "<!-- plans:table:start -->", end = "<!-- plans:table:end -->";
const fixture = `Outside before\n${start}\nold table\n${end}\nOutside after\n`;

test("table lists independent important permissions, themes and all four quotas", () => {
  const table = renderTable();
  for (const row of [
    "| Form liên hệ/tư vấn (`leadForm`) | Có | Có | Có |",
    "| Form nhận báo giá (`quoteForm`) | — | Có | Có |",
    "| Chứng nhận / uy tín (`trust`) | — | Có | Có |",
    "| Mạng xã hội (`social`) | — | Có | Có |",
    "| Danh mục sản phẩm (`catalog`) | — | — | Có |",
    "| Giỏ báo giá (`quoteCart`) | — | — | Có |",
    "| Video tự host (`videoUpload`) | — | — | Có |",
    "| Số tên miền | 1 | 1 | 3 |", "| Media (GB) | 1 | 5 | 20 |",
    "| Số trang do khách tạo | 1 | 3 | 20 |", "| Số người dùng | 1 | 3 | 10 |",
  ]) assert.ok(table.includes(row), row);
  assert.ok(table.includes("Classic (minwy, t02–t04), Pro (t05–t11), Signature (t12–t15)"));
  assert.equal(table.split("\n").filter(line => line.includes("(`")).length, 33);
});

test("replacement preserves everything outside markers and handles Windows newlines", () => {
  const lf = replaceTable(fixture);
  assert.equal(lf, `Outside before\n${start}\n${renderTable()}\n${end}\nOutside after\n`);
  const crlf = replaceTable(fixture.replace(/\n/g, "\r\n"));
  assert.equal(crlf.replace(/\r\n/g, "\n"), lf);
  assert.equal(replaceTable(crlf), crlf);
});

test("missing, duplicate and reversed markers fail", () => {
  for (const input of ["none", start, end, `${end}\n${start}`, `${fixture}${start}`, `${fixture}${end}`]) {
    assert.throws(() => replaceTable(input), /marker/i);
  }
});

test("check exits 1 on drift or invalid markers without writing; writer is idempotent", t => {
  const dir = mkdtempSync(join(tmpdir(), "solar-plans-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, "README.md");
  writeFileSync(file, fixture);
  assert.equal(runTable(file, true), 1);
  assert.equal(readFileSync(file, "utf8"), fixture);
  assert.equal(runTable(file, false), 0);
  const generated = readFileSync(file, "utf8");
  assert.equal(runTable(file, true), 0);
  assert.equal(runTable(file, false), 0);
  assert.equal(readFileSync(file, "utf8"), generated);
  writeFileSync(file, generated.replace(/\n/g, "\r\n"));
  assert.equal(runTable(file, true), 0);
  const drift = generated.replace("| Số tên miền | 1 | 1 | 3 |", "| Số tên miền | 9 | 9 | 9 |");
  writeFileSync(file, drift);
  const script = resolve(__dirname, "../scripts/table.js");
  const result = spawnSync(process.execPath, ["-e", `process.exitCode = require(${JSON.stringify(script)}).runTable(${JSON.stringify(file)}, true)`], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(readFileSync(file, "utf8"), drift);
  writeFileSync(file, "missing marker");
  assert.equal(runTable(file, true), 1);
  assert.equal(readFileSync(file, "utf8"), "missing marker");
  const cli = spawnSync(process.execPath, [script, "--check"], { cwd: dir, encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  const invalid = spawnSync(process.execPath, [script, "--unknown"], { cwd: dir, encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Usage/);

});
