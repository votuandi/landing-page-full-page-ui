import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Scanner tạm đến E2-S04; regex chỉ nhận diện style phổ biến, không phân tích AST.
const rules = [
  [/#[0-9a-fA-F]{3,8}\b/g, "Dùng token màu"],
  [/\b(?:rgb|hsl)\((?!\s*var\(--c-)\s*/g, "Dùng biến màu var(--c-…)"],
  [/\b(?:bg|text|from|to|via|border|rounded|shadow|font)-\[/g, "Dùng class sinh từ token"],
  [/\b(?:bg|text|from|to|via|border|ring|divide|outline|decoration|fill|stroke|shadow|accent|caret|placeholder)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/g, "Dùng màu semantic của theme"],
];

export function findViolations(text, file) {
  if (file.replaceAll("\\", "/").split("/").includes("brand-icons")) return [];
  const violations = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (/(?:\/\/|\/\*)\s*token-exempt:\s*[^\s*]/.test(line)) return;
    for (const [pattern, suggestion] of rules) {
      for (const match of line.matchAll(pattern)) {
        violations.push({ file, line: index + 1, pattern: match[0], suggestion });
      }
    }
  });
  return violations;
}

function scan(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((name) => name === "brand-icons" ? [] : scan(join(path, name)));
  }
  return [".ts", ".tsx", ".css"].includes(extname(path)) ? findViolations(readFileSync(path, "utf8"), path) : [];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = (process.argv.slice(2).length ? process.argv.slice(2) : ["src"]).flatMap(scan);
  for (const item of violations) console.log(`${item.file}:${item.line}: ${item.pattern} — ${item.suggestion}`);
  console.log(`lint:tokens: ${violations.length} vi phạm`);
  process.exitCode = violations.length ? 1 : 0;
}
