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
