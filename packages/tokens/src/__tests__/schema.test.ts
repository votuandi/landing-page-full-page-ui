import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { parseTheme, safeParseTheme, ThemeParseError, ThemeTokensSchema } from "../index";
import { t15 } from "./fixtures/t15";

function withField(path: string, value: unknown) {
  const theme = structuredClone(t15);
  const keys = path.split(".");
  let parent = theme as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) parent = parent[key] as Record<string, unknown>;
  parent[keys[keys.length - 1]] = value;
  return theme;
}

function errorAt(input: unknown, path: string) {
  const result = safeParseTheme(input);
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Theme phải bị từ chối");
  assert.ok(result.error instanceof ThemeParseError);
  assert.equal(result.error.name, "ThemeParseError");
  const issue = result.error.issues.find((issue) => issue.path === path);
  assert.ok(issue, `Thiếu lỗi ở ${path}: ${result.error.message}`);
  assert.ok(result.error.message.includes(path));
  return result.error;
}

test("t15 parse thành công, giữ nguyên toàn bộ dữ liệu", () => {
  assert.deepEqual(parseTheme(t15), t15);
  assert.deepEqual(ThemeTokensSchema.parse(t15), t15);
});

test("fixture t15 khớp mọi khóa và giá trị RGB/kính của CSS light và dark", () => {
  // E2-S07 sẽ đổi test này khi chuyển khối màu CSS sang packages/themes.
  const css = readFileSync(resolve(process.cwd(), "../../apps/web/src/app/globals.css"), "utf8");
  for (const [mode, selector] of [
    ["light", ':root, [data-theme="light"] {'],
    ["dark", '[data-theme="dark"] {'],
  ] as const) {
    const start = css.indexOf(selector);
    assert.ok(start >= 0, `Thiếu selector ${selector}`);
    const block = css.slice(start + selector.length, css.indexOf("}", start));
    const rgb = [...block.matchAll(/--c-([a-z-]+):\s*(\d+ \d+ \d+)\s*;/g)]
      .map((match) => [match[1], match[2]]);
    const glass = [...block.matchAll(/--(glass(?:-border|-strong(?:-border)?)?):\s*(rgba\([^;]+\))\s*;/g)]
      .map((match) => [match[1], match[2]]);
    assert.deepEqual(Object.fromEntries([...rgb, ...glass]), t15.colors[mode]);
    if (mode === "light") {
      assert.equal(rgb.length, 35);
      assert.equal(glass.length, 4);
    }
  }
});

test("thiếu primary: throw ThemeParseError có ID, đường dẫn và lý do tiếng Việt", () => {
  const theme = structuredClone(t15);
  Reflect.deleteProperty(theme.colors.light, "primary");
  assert.throws(() => parseTheme(theme), (error: unknown) => {
    assert.ok(error instanceof ThemeParseError);
    assert.match(error.message, /^Theme "t15" không hợp lệ:/);
    assert.match(error.message, /colors\.light\.primary: thiếu trường bắt buộc/);
    assert.deepEqual(error.issues.find((issue) => issue.path === "colors.light.primary"), {
      path: "colors.light.primary", message: "thiếu trường bắt buộc",
    });
    return true;
  });
});

for (const value of ["21,128,61", "21 128 300", "-1 128 61", "21  128 61", "21.5 128 61"]) {
  test(`RGB sai định dạng hoặc ngoài miền: ${value}`, () => {
    const error = errorAt(withField("colors.light.primary", value), "colors.light.primary");
    assert.match(error.message, /phải có dạng "R G B"/);
  });
}

for (const value of ["#fff", "rgba(256,0,0,0.5)", "rgba(0,0,0,1.1)", "rgba(0,0,0,-0.1)"]) {
  test(`RGBA sai định dạng hoặc ngoài miền: ${value}`, () => {
    const error = errorAt(withField("colors.light.glass", value), "colors.light.glass");
    assert.match(error.message, /phải có dạng rgba\(R,G,B,A\)/);
  });
}

test("RGB/RGBA chấp nhận biên và giữ nguyên khoảng trắng RGBA", () => {
  for (const primary of ["0 0 0", "255 255 255"]) {
    for (const glass of ["rgba( 0, 255, 0, 0 )", "rgba(255,255,255,1)", "rgba(0,0,0,.5)"]) {
      const theme = withField("colors.light.primary", primary);
      theme.colors.light.glass = glass;
      assert.deepEqual(parseTheme(theme), theme);
    }
  }
});

test("màu gõ sai tên bị báo là trường không được hỗ trợ", () => {
  const error = errorAt(withField("colors.light.primry", "21 128 61"), "colors.light");
  assert.match(error.message, /trường không được hỗ trợ: primry/);
});

test("mọi object con và root từ chối trường lạ", () => {
  for (const path of ["", "colors", "colors.dark", "font", "radius", "shadow", "glass", "motion", "density", "meta"]) {
    const error = errorAt(withField(path ? `${path}.typo` : "typo", true), path);
    assert.match(error.message, /trường không được hỗ trợ: typo/);
  }
});

test("supportsDark=true bắt buộc có colors.dark", () => {
  const theme = structuredClone(t15);
  Reflect.deleteProperty(theme.colors, "dark");
  errorAt(theme, "colors.dark");
});

test("supportsDark=false chấp nhận theme chỉ có light", () => {
  const theme = structuredClone(t15);
  theme.meta.supportsDark = false;
  Reflect.deleteProperty(theme.colors, "dark");
  assert.deepEqual(parseTheme(theme), theme);
});

test("supportsDark=false từ chối colors.dark còn tồn tại", () => {
  errorAt(withField("meta.supportsDark", false), "meta.supportsDark");
});

test("dark là partial, không điền thêm token light khi parse", () => {
  for (const dark of [{ primary: "74 222 128" }, {}]) {
    const theme = withField("colors.dark", dark);
    assert.deepEqual(parseTheme(theme), theme);
  }
  errorAt(withField("colors.dark.primary", "300 0 0"), "colors.dark.primary");
});

for (const [path, value] of [
  ["shadow.strength", 1.2], ["shadow.strength", -0.1], ["shadow.tint", "primry"],
  ["font.weights", [450]], ["font.weights", [400, 400]], ["font.weights", []],
  ["font.weights", [0]], ["font.weights", [1000]], ["font.weights", [400.5]],
  ["font.sans", ""], ["font.display", ""], ["font.source", "remote"],
  ["radius.card", "28"], ["radius.card", "-1px"], ["radius.card", "2em"],
  ["glass.blur", -1], ["glass.blur", 65], ["glass.blur", 1.5], ["glass.enabled", "true"],
  ["motion.durationFast", -1], ["motion.durationBase", 5001], ["motion.durationSlow", 0.5],
  ["motion.revealDistance", 201], ["motion.revealDistance", -1], ["motion.easing", ""],
  ["motion.revealEnabled", "true"], ["density.sectionY", "xl"],
  ["density.container", 639], ["density.container", 1921], ["density.container", 1280.5],
  ["meta.group", "gold"], ["meta.id", "T15"], ["meta.id", "t15--test"],
  ["meta.name", ""], ["meta.preview", ""], ["meta.supportsDark", "true"],
] as const) {
  test(`từ chối giá trị sai ở ${path}: ${JSON.stringify(value)}`, () => {
    // Lỗi phần tử weights có đường dẫn kèm index.
    const issuePath = path === "font.weights" && Array.isArray(value) && value.length === 1
      ? `${path}.0` : path;
    errorAt(withField(path, value), issuePath);
  });
}

test("chấp nhận biên số, radius rem, nguồn local và preview tùy chọn", () => {
  for (const upper of [false, true]) {
    const theme = structuredClone(t15);
    theme.shadow.strength = upper ? 1 : 0;
    theme.font.weights = [100, 900];
    theme.font.source = "local";
    theme.radius.card = "1.75rem";
    theme.glass.blur = upper ? 64 : 0;
    theme.motion.durationFast = theme.motion.durationBase = theme.motion.durationSlow = upper ? 5000 : 0;
    theme.motion.revealDistance = upper ? 200 : 0;
    theme.density.container = upper ? 1920 : 640;
    assert.deepEqual(parseTheme(theme), theme);
  }
  const theme = withField("meta.preview", "/themes/t15.png");
  assert.deepEqual(parseTheme(theme), theme);
});

test("nhiều lỗi được gom đủ, không dừng ở lỗi đầu", () => {
  const theme = withField("colors.light.primary", "300 0 0");
  theme.radius.card = "28";
  const result = safeParseTheme(theme);
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Theme phải bị từ chối");
  assert.ok(result.error.issues.length >= 2);
  assert.ok(result.error.issues.some((issue) => issue.path === "colors.light.primary"));
  assert.ok(result.error.issues.some((issue) => issue.path === "radius.card"));
});

test("safeParseTheme trả union thành công/thất bại và xử lý input unknown", () => {
  assert.deepEqual(safeParseTheme(t15), { ok: true, theme: t15 });
  for (const input of [null, undefined, [], "t15", { meta: { id: 15 } }]) {
    const result = safeParseTheme(input);
    assert.equal(result.ok, false);
    if (result.ok) assert.fail("Input phải bị từ chối");
    assert.ok(result.error instanceof ThemeParseError);
    assert.match(result.error.message, /^Theme "\?" không hợp lệ:/);
  }
});
