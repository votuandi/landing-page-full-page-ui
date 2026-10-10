import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const themes = require("../index.ts");
const { t15, themeFontFamilies, themeFontFiles, themeFontCss } = themes;
const { FONTS } = require("../fonts.generated.ts");
const t11 = { ...t15, font: { ...t15.font, display: "Manrope" } };

test("t11 chỉ chọn 3 file Be Vietnam Pro và 1 file Manrope", () => {
  assert.deepEqual(themeFontFamilies(t11), ["Be Vietnam Pro", "Manrope"]);
  assert.deepEqual(themeFontFiles(t11), [
    ...FONTS["Be Vietnam Pro"].files.map(({ file }) => file),
    ...FONTS.Manrope.files.map(({ file }) => file),
  ]);
  const css = themeFontCss(t11);
  assert.equal((css.match(/@font-face\{/g) ?? []).length, 6);
  for (const family of ["Inter", "Plus Jakarta Sans", "Montserrat"]) {
    assert.ok(!css.includes(family));
  }
  assert.ok(css.includes('font-weight:200 800;'));
  assert.ok(css.includes('--font-display:"Manrope","Manrope Fallback"'));
});

test("t15 bỏ trùng họ font và chỉ tải 3 file đúng weight", () => {
  assert.deepEqual(themeFontFamilies(t15), ["Be Vietnam Pro"]);
  assert.deepEqual(themeFontFiles(t15), FONTS["Be Vietnam Pro"].files.map(({ file }) => file));
  const css = themeFontCss(t15);
  assert.equal((css.match(/@font-face\{/g) ?? []).length, 4);
  for (const role of ["sans", "display"]) {
    assert.ok(css.includes(`--font-${role}:"Be Vietnam Pro","Be Vietnam Pro Fallback"`));
  }
  assert.ok(css.includes('src:local("Arial")'));
  for (const property of ["ascent-override", "descent-override", "line-gap-override", "size-adjust"]) {
    assert.match(css, new RegExp(`${property}:[\\d.]+%`));
  }
  assert.equal((css.match(/font-display:swap/g) ?? []).length, 4);
});

test("mọi theme và fixture t11 tải tối đa 2 họ và 4 woff2", () => {
  const exported = Object.values(themes).filter((value) => value?.meta?.id);
  assert.ok(exported.length > 0);
  for (const theme of [...exported, t11]) {
    assert.ok(themeFontFamilies(theme).length <= 2);
    assert.ok(themeFontFiles(theme).length <= 4);
  }
});

test("mọi file được host, hash đúng nội dung và khai báo dải tiếng Việt", () => {
  for (const { files } of Object.values(FONTS)) {
    for (const { file, unicodeRange } of files) {
      const hash = file.match(/\.([0-9a-f]{8})\.woff2$/)?.[1];
      assert.ok(hash, file);
      const data = readFileSync(new URL(`../../../../apps/web/public/fonts/${file}`, import.meta.url));
      assert.equal(createHash("sha256").update(data).digest("hex").slice(0, 8), hash);
      assert.equal(data.toString("ascii", 0, 4), "wOF2");
      for (const range of ["U+1EA0-1EF9", "U+0102-0103", "U+0110-0111", "U+01A0-01A1", "U+01AF-01B0"]) {
        assert.ok(unicodeRange.includes(range), `${file}: ${range}`);
      }
    }
  }
});

test("lọc weight static, dùng một file variable và tạo CSS ổn định", () => {
  const theme = { ...t15, font: { ...t15.font, weights: [800, 400], display: "Inter" } };
  const files = themeFontFiles(theme);
  assert.equal(files.length, 3);
  assert.ok(!files.some((file) => file.startsWith("be-vietnam-pro-600")));
  assert.equal(themeFontCss(theme), themeFontCss({ ...theme, font: { ...theme.font, weights: [400, 800] } }));
  assert.ok(themeFontCss(theme, "/assets/fonts/").includes('url("/assets/fonts/'));
});

test("từ chối họ font ngoài danh sách, weight thiếu và baseUrl chèn CSS", () => {
  const unknown = { ...t15, font: { ...t15.font, sans: "Comic Sans" } };
  for (const select of [themeFontFamilies, themeFontFiles, themeFontCss]) {
    assert.throws(() => select(unknown), /Comic Sans/);
  }
  for (const weight of [350, 900]) {
    assert.throws(() => themeFontFiles({ ...t15, font: { ...t15.font, weights: [weight] } }), /weight/i);
  }
  assert.throws(() => themeFontFiles({ ...t11, font: { ...t11.font, weights: [900] } }), /weight/i);
  for (const baseUrl of ["/x}</style>", "https://example.com/", "/fonts", "/x/../fonts/", "/f\n/"]) {
    assert.throws(() => themeFontCss(t15, baseUrl), /baseUrl/);
  }
});
