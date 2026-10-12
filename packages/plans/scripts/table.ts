import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FEATURES, PLAN_IDS, plans, featureLabels, limitLabels, themeLabels, type LimitKey } from "../index";

const START = "<!-- plans:table:start -->", END = "<!-- plans:table:end -->";
const normalize = (text: string) => text.replace(/\r\n/g, "\n");

export function renderTable(): string {
  const row = (label: string, values: readonly (string | number)[]) => `| ${label} | ${values.join(" | ")} |`;
  return [
    row("", PLAN_IDS.map(id => `**${plans[id].name}**`)),
    "|---|---|---|---|",
    row("Nhóm theme", PLAN_IDS.map(id => plans[id].themes.map(group => themeLabels[group]).join(", "))),
    ...FEATURES.map(feature => row(`${featureLabels[feature]} (\`${feature}\`)`, PLAN_IDS.map(id => plans[id].features.has(feature) ? "Có" : "—"))),
    ...(Object.keys(limitLabels) as LimitKey[]).map(key => row(limitLabels[key], PLAN_IDS.map(id => plans[id].limits[key]))),
  ].join("\n");
}

export function replaceTable(text: string): string {
  const start = text.indexOf(START), end = text.indexOf(END);
  if (start < 0 || end < start + START.length || text.indexOf(START, start + START.length) !== -1 || text.indexOf(END, end + END.length) !== -1) {
    throw new Error("Expected exactly one ordered pair of plans:table markers");
  }
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  return text.slice(0, start + START.length) + newline + renderTable().replace(/\n/g, newline) + newline + text.slice(end);
}

export function runTable(file: string, check: boolean): number {
  try {
    const current = readFileSync(file, "utf8"), generated = replaceTable(current);
    if (check && normalize(current) !== normalize(generated)) {
      console.error("Plan table differs from @solar/plans. Run pnpm plans:table.");
      return 1;
    }
    if (!check && current !== generated) writeFileSync(file, generated);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    console.error("Usage: pnpm plans:table [--check]");
    process.exitCode = 1;
  } else {
    // The CLI is compiled into packages/plans/.test-dist/scripts, independent of caller cwd.
    process.exitCode = runTable(resolve(__dirname, "../../../../roadmap/README.md"), args[0] === "--check");
  }
}
