import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Workspace packages export TypeScript source; Node 20 needs transpilation for these tests.
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

test("export t15 parse thành công và khớp fixture chuẩn, gồm màu dark partial", () => {
  const { t15 } = require("../index.ts");
  const { parseTheme, themeToCss } = require("@solar/tokens");
  const { t15: fixture } = require("../../../tokens/src/__tests__/fixtures/t15.ts");
  assert.deepEqual(t15, parseTheme(fixture));
  assert.deepEqual(parseTheme(t15), t15);
  assert.equal(themeToCss(t15), themeToCss(parseTheme(fixture)));
});

test("mọi theme đạt WCAG AA cho cặp bắt buộc", () => {
  const themes = Object.values(require("../index.ts")).filter((value) => value?.meta?.id);
  const { checkContrast } = require("@solar/tokens");
  assert.ok(themes.length > 0, "cần ít nhất một theme được export");
  for (const theme of themes) {
    const issues = checkContrast(theme);
    const details = issues.map((issue) =>
      `${issue.mode}: ${issue.fg}/${issue.bg}${issue.scrimAlpha === undefined ? "" : ` (alpha ${issue.scrimAlpha})`}`
      + ` = ${issue.ratio.toFixed(3)} < ${issue.min}; gợi ý ${issue.suggestion}`).join("\n");
    assert.deepEqual(issues, [], `Theme ${theme.meta.id} không đạt WCAG AA:\n${details}`);
  }
});
