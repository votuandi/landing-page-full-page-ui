#!/usr/bin/env node
// Visual changes a PR intends (E11-S03): its body declares `Visual intended: lead-form, calculator, /lien-he`.
// After a failed compare run, pass only when every failed test is a screenshot diff of a declared section type
// (`<type>/<theme>` matrix cells) or route (`/path` visual pages). Anything else — undeclared cells, timeouts,
// contrast or off-token assertions — keeps the job red. The base baseline is regenerated after merge.
//   PR_BODY="$BODY" node scripts/ci/visual-intended.mjs <playwright-json-report>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function intendedFrom(body) {
  const line = String(body ?? "").split(/\r?\n/).find(l => /^\s*visual intended\s*:/i.test(l));
  return line ? line.replace(/^[^:]*:/, "").split(",").map(s => s.trim()).filter(Boolean) : [];
}

const declared = (title, intended) => intended.some(entry => entry.startsWith("/") ? title === entry : title.startsWith(`${entry}/`));
// Only a real pixel diff: `toHaveScreenshot` also fails on timeouts and "two consecutive stable screenshots".
// eslint-disable-next-line no-control-regex
const plain = (message = "") => message.replace(/\u001b\[[0-9;]*m/g, "");
const screenshotOnly = (results) => {
  const errors = results.flatMap(r => r.errors ?? []);
  return errors.length > 0 && errors.every(e => /\d+ pixels \(ratio/.test(plain(e.message)));
};

export function judge(report, intended) {
  const failed = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) for (const t of spec.tests ?? []) if (t.status === "unexpected") failed.push({ title: spec.title, results: t.results ?? [] });
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);
  const unintended = [...new Set(failed.filter(f => !declared(f.title, intended) || !screenshotOnly(f.results)).map(f => f.title))];
  // Runs only after Playwright exited non-zero: no failed test, or run-level errors, mean the run itself broke (fail closed).
  const broken = (report.errors ?? []).length > 0 || failed.length === 0;
  return { ok: !broken && unintended.length === 0, failed: failed.length, unintended, broken };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const intended = intendedFrom(process.env.PR_BODY);
  const { ok, failed, unintended, broken } = judge(JSON.parse(readFileSync(process.argv[2], "utf8")), intended);
  if (ok) console.log(`::notice::${failed} visual diff(s), all declared in the PR body (Visual intended: ${intended.join(", ")}). Review the report artifact.`);
  else if (broken) console.log("::error::Playwright failed without any screenshot diff to explain it (build, webServer or run-level error).");
  else console.log(`::error::Visual failures not declared as intended screenshot diffs: ${unintended.join(", ")}${intended.length ? "" : " (PR body has no `Visual intended:` line)"}`);
  process.exit(ok ? 0 : 1);
}
