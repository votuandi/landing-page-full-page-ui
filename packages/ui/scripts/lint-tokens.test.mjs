import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { findViolations } from "./lint-tokens.mjs";

for (const text of ["bg-[#0E7C3A]", "rgb(1,2,3)", "hsl(120,50%,50%)", "rounded-[28px]", "text-[11px]", "font-[Arial]", "shadow-[0_1px_2px]", "bg-white", "text-slate-500"]) {
  test(`rejects ${text}`, () => {
    const violations = findViolations(`\n${text}`, "src/Card.tsx");
    assert.ok(violations.length > 0);
    assert.equal(violations[0].file, "src/Card.tsx");
    assert.equal(violations[0].line, 2);
  });
}

for (const text of ["bg-primary text-fg-muted rounded-card text-2xs bg-media-glow", "rgb(var(--c-accent) / .2)", "rgb( var(--c-accent) / .2)", "z-[90] aspect-[9/16] tracking-[-.02em]", 'const href = "#CarouselNav";', 'const token = "token-exempt: no comment";']) {
  test(`allows ${text}`, () => assert.deepEqual(findViolations(text, "src/Card.tsx"), []));
}

test("only comments with an exemption reason skip a line", () => {
  assert.deepEqual(findViolations('const color = "#0E7C3A"; // token-exempt: logo bên thứ ba', "src/Card.tsx"), []);
  assert.deepEqual(findViolations('/* token-exempt: logo bên thứ ba */ bg-[#0E7C3A]', "src/Card.tsx"), []);
  assert.ok(findViolations('bg-[#0E7C3A] // token-exempt:', "src/Card.tsx").length > 0);
  assert.ok(findViolations('const label = "token-exempt: fake"; bg-[#0E7C3A]', "src/Card.tsx").length > 0);
});

test("brand-icons exemption supports both path separators", () => {
  for (const file of ["src/brand-icons/index.tsx", "src\\brand-icons\\index.tsx"]) {
    assert.deepEqual(findViolations("#0E7C3A", file), []);
  }
  assert.ok(findViolations("#0E7C3A", "src/not-brand-icons/Card.tsx").length > 0);
});

test("CLI scans nested source files, reports failures and exits nonzero", () => {
  const dir = mkdtempSync(join(tmpdir(), "solar-ui-tokens-"));
  try {
    mkdirSync(join(dir, "nested"));
    writeFileSync(join(dir, "nested", "Card.tsx"), '\n<div className="rounded-[28px]" />');
    writeFileSync(join(dir, "ignored.md"), "bg-[#0E7C3A]");
    const run = () => spawnSync(process.execPath, [fileURLToPath(new URL("./lint-tokens.mjs", import.meta.url)), dir], { encoding: "utf8" });
    const fail = run();
    assert.equal(fail.status, 1);
    assert.match(fail.stdout, /Card\.tsx:2:.*rounded-\[/);
    writeFileSync(join(dir, "nested", "Card.tsx"), '<div className="rounded-card bg-primary" />');
    const pass = run();
    assert.equal(pass.status, 0);
    assert.match(pass.stdout, /0 vi phạm/);
  } finally {
    const target = relative(tmpdir(), dir);
    assert.ok(target && !target.startsWith("..") && !isAbsolute(target));
    rmSync(dir, { recursive: true, force: true });
  }
});
