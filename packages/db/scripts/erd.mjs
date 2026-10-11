import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)];
const entities = new Set(models.map(([, name]) => name));
const lines = ["# Mô hình dữ liệu tenant", "", "Sinh từ `prisma/schema.prisma` bằng `pnpm --filter @solar/db db:erd`.", "", "Khóa ngoại giữa bảng tenant luôn ghép `(tenantId, xxxId) → (tenantId, id)`.", "`Outbox` và `AuditLog` cho phép `tenantId = null` cho tác vụ nền tảng.", "", "```mermaid", "erDiagram"];
const relations = [];
for (const [, name, body] of models) {
  lines.push(`  ${name} {`);
  for (const line of body.split("\n")) {
    const match = line.match(/^\s*(\w+)\s+(\w+)(\[\]|\?)?\s*(.*)$/);
    if (!match) continue;
    const [, field, type, suffix = "", attrs] = match;
    if (entities.has(type)) {
      const fk = attrs.match(/@relation\((?:"\w+", )?fields: \[([^\]]+)\]/);
      if (fk) relations.push(`  ${type} ${suffix === "?" ? "|o" : "||"}--o{ ${name} : "${fk[1]}"`);
    } else {
      const key = attrs.includes("@id") ? " PK" : attrs.includes("@unique") ? " UK" : "";
      lines.push(`    ${type}${suffix === "[]" ? "_array" : ""} ${field}${key}`);
    }
  }
  lines.push("  }");
}
lines.push(...relations, "```", "");
const output = lines.join("\n");
const path = fileURLToPath(new URL("../ERD.md", import.meta.url));
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8").replaceAll("\r\n", "\n") !== output) throw new Error("ERD.md is stale: run db:erd");
} else writeFileSync(path, output);
