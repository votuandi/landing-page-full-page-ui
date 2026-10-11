import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
async function cellFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await cellFiles(path));
    else if (entry.name === "cells.json") files.push(path);
  }
  return files;
}

const run = JSON.parse(await readFile(resolve("test-results/matrix-run.json"), "utf8"));
const results = (await Promise.all((await cellFiles(resolve("test-results/matrix"))).map(async (file) =>
  JSON.parse(await readFile(file, "utf8"))))).flat();
const themes = new Set(results.map((cell) => cell.theme));
const columns = [...new Set(results.map((cell) => `${cell.theme} · ${cell.viewport} · ${cell.mode}`))].sort();
const rows = [...new Set(results.map((cell) => `${cell.type}/${cell.variant}`))].sort();
const offTokenCount = results.reduce((sum, cell) => sum + cell.offToken.length, 0);
const nodeCount = (cell) => cell.contrast.reduce((sum, violation) => sum + violation.nodes.length, 0);
const failed = run.stats.unexpected + run.stats.skipped;
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ma trận section — E3-S10</title><style>
body{font:14px system-ui;margin:24px;color:#17242a;background:#f5f7f8}h1{margin-bottom:8px}table{border-collapse:collapse;width:100%;background:white}th,td{border:1px solid #c7d1d5;padding:12px;text-align:left}th{background:#e7edf0}.contrast{background:#ffe0e0}.off-token{background:#ffe4b8}.missing{background:#eee}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}caption{text-align:left;padding:12px 0}.scroll{overflow:auto}
</style><h1>Ma trận section — E3-S10</h1>
<p>${results.length} ô · ${themes.size} theme · ${(run.stats.duration / 1000).toFixed(2)} giây · ngoài token: ${offTokenCount} · node tương phản &lt; AA: ${results.reduce((sum, cell) => sum + nodeCount(cell), 0)}</p>
<p>Trạng thái test: ${run.stats.expected} đạt, ${run.stats.unexpected} lỗi, ${run.stats.skipped} bỏ qua.${failed ? " Kết quả chưa đầy đủ hoặc có test lỗi; xem Playwright report." : ""}</p>
<p>Ma trận hiện có ${themes.size} theme — mục tiêu ≥ 4 theme đạt sau E4. [DỮ LIỆU MẪU]</p>
<div class="scroll"><table><caption>Đỏ: tương phản &lt; AA (axe-core). Cam: màu ngoài token. “Cần kiểm tra”: axe không xác định được tương phản.</caption>
<thead><tr><th>Type / variant</th>${columns.map((column) => `<th>${escape(column)}</th>`).join("")}</tr></thead><tbody>
${rows.map((row) => `<tr><th>${escape(row)}</th>${columns.map((column) => {
  const cell = results.find((cell) => `${cell.type}/${cell.variant}` === row && `${cell.theme} · ${cell.viewport} · ${cell.mode}` === column);
  if (!cell) return '<td class="missing">Thiếu kết quả</td>';
  const nodes = nodeCount(cell);
  const incomplete = cell.incomplete.reduce((sum, entry) => sum + entry.nodes, 0);
  const status = cell.offToken.length ? "off-token" : nodes ? "contrast" : "";
  return `<td class="${status}">${nodes ? `&lt; AA: ${nodes} node` : "Không có vi phạm AA được axe xác định"}<br>Ngoài token: ${cell.offToken.length}${incomplete ? `<br>Cần kiểm tra: ${incomplete} node` : ""}<details><summary>Chi tiết</summary><pre>${escape(JSON.stringify({ offToken: cell.offToken, contrast: cell.contrast, incomplete: cell.incomplete }, null, 2))}</pre></details></td>`;
}).join("")}</tr>`).join("")}</tbody></table></div></html>`;
await mkdir("matrix-report", { recursive: true });
await writeFile("matrix-report/index.html", html);
console.log(`matrix-report/index.html: ${results.length} ô, ${offTokenCount} màu ngoài token, ${(run.stats.duration / 1000).toFixed(2)} giây`);
