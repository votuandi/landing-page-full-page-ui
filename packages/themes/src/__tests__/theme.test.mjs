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

test("four Classic themes use Inter, light mode and their source identities", () => {
  const { getTheme, themeFontFamilies } = require("../index.ts");
  for (const [id, primary] of [["t01", "21 128 61"], ["t02", "20 83 45"], ["t03", "194 65 12"], ["t04", "27 94 69"]]) {
    const theme = getTheme(id);
    assert.ok(theme, id);
    assert.equal(theme.meta.group, "classic");
    assert.equal(theme.meta.supportsDark, false);
    assert.equal(theme.colors.light.primary, primary);
    assert.deepEqual(themeFontFamilies(theme), ["Inter"]);
  }
});

test("export t15 parse thành công và khớp fixture chuẩn, gồm màu dark partial", () => {
  const { t15 } = require("../index.ts");
  const { parseTheme, themeToCss } = require("@solar/tokens");
  const { t15: fixture } = require("../../../tokens/src/__tests__/fixtures/t15.ts");
  assert.deepEqual(t15, parseTheme(fixture));
  assert.deepEqual(parseTheme(t15), t15);
  assert.equal(themeToCss(t15), themeToCss(parseTheme(fixture)));
});

test("mọi theme đạt WCAG AA cho cặp bắt buộc", () => {
  const { themes } = require("../index.ts");
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

test("t13 giữ Warm Sand, đất nung + teal và chỉ tải Inter của bản gốc", () => {
  const { t13, getTheme, themeFontFamilies, themeFontFiles } = require("../index.ts");
  const { parseTheme } = require("@solar/tokens");
  const { FONTS } = require("../fonts.generated.ts");
  assert.ok(t13, "cần export theme t13");
  assert.equal(getTheme("t13"), t13);
  assert.deepEqual(parseTheme(t13), t13);
  assert.deepEqual(t13.meta, { id: "t13", name: "Warm Sand", group: "signature", supportsDark: false });
  assert.equal(t13.colors.dark, undefined);
  assert.equal(t13.colors.light.bg, "251 247 241");
  assert.equal(t13.colors.light["bg-tint"], "243 235 223");
  assert.equal(t13.colors.light.primary, "194 65 12");
  assert.equal(t13.colors.light.accent, "15 118 110");
  assert.equal(t13.radius.input, "14px");
  assert.deepEqual(themeFontFamilies(t13), ["Inter"]);
  assert.deepEqual(themeFontFiles(t13), FONTS.Inter.files.map(({ file }) => file));
});

test("t12 đăng ký Sky & Sun, Emerald Dusk và font Inter", () => {
  const { getTheme } = require("../index.ts");
  const { parseTheme } = require("@solar/tokens");
  const theme = getTheme("t12");
  assert.ok(theme);
  assert.deepEqual(parseTheme(theme), theme);
  assert.equal(theme.meta.name, "Sky & Sun");
  assert.equal(theme.meta.supportsDark, true);
  assert.equal(theme.font.sans, "Inter");
  assert.equal(theme.colors.light.primary, "14 116 144");
  assert.equal(theme.colors.dark.bg, "11 31 28");
  assert.equal(theme.colors.dark.primary, "16 185 129");
});

test("registry có id duy nhất và tra cứu đúng theme", () => {
  const { themes, getTheme, t15 } = require("../index.ts");
  assert.ok(themes.length > 0);
  assert.equal(new Set(themes.map((theme) => theme.meta.id)).size, themes.length);
  for (const theme of themes) assert.equal(getTheme(theme.meta.id), theme);
  assert.equal(getTheme("t15"), t15);
  assert.equal(getTheme("khong-co"), undefined);
});

test("t14 mặc định emerald tối, kính và font Inter của template-14", () => {
  const { getTheme, t14 } = require("../index.ts");
  const { parseTheme, themeToCss } = require("@solar/tokens");
  assert.ok(t14);
  assert.equal(getTheme("t14"), t14);
  assert.deepEqual(parseTheme(t14), t14);
  assert.equal(t14.colors.light.bg, "11 31 28");
  assert.equal(t14.colors.light.primary, "16 185 129");
  assert.equal(t14.colors.light.accent, "245 184 61");
  assert.equal(t14.font.sans, "Inter");
  assert.equal(t14.glass.blur, 24);
  assert.equal(t14.glass.enabled, true);
  assert.equal(t14.meta.group, "signature");
  assert.match(themeToCss(t14), /--c-bg:11 31 28/);
});
