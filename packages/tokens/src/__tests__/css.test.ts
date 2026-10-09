import assert from "node:assert/strict";
import { test } from "node:test";
import { COLOR_KEYS, GLASS_COLOR_KEYS, parseTheme } from "../schema";
import { themeToCss, type ThemeOverrides } from "../css";
import { t15 as fixture } from "./fixtures/t15";

const t15 = parseTheme(fixture);
const lightSelector = ':root,[data-theme="light"]';
const darkSelector = '[data-theme="dark"]';
const mediaSelector = ':root:not([data-theme])';

function block(css: string, selector: string) {
  const start = css.indexOf(`${selector}{`);
  assert.ok(start >= 0, `Thiếu selector ${selector}`);
  return css.slice(start + selector.length + 1, css.indexOf("}", start));
}

test("t15 sinh đầy đủ màu light và đúng tập màu dark, thứ tự ổn định", () => {
  const css = themeToCss(t15);
  assert.ok(css.startsWith(`${lightSelector}{`));
  assert.ok(css.includes('@media (prefers-color-scheme:dark){'));
  for (const [mode, selector] of [["light", lightSelector], ["dark", darkSelector]] as const) {
    const declarations = block(css, selector);
    const colors = Object.fromEntries([
      ...declarations.matchAll(/--c-([a-z-]+):(\d+ \d+ \d+);/g),
      ...declarations.matchAll(/--(glass(?:-border|-strong(?:-border)?)?):(rgba\([^;]+\));/g),
    ].map((match) => [match[1], match[2]]));
    assert.deepEqual(colors, t15.colors[mode]);
    const expectedKeys = [
      ...COLOR_KEYS.map((key) => `--c-${key}`),
      ...GLASS_COLOR_KEYS.map((key) => `--${key}`),
    ].filter((key) => declarations.includes(`${key}:`));
    assert.deepEqual(declarations.split(";").slice(0, expectedKeys.length).map((entry) => entry.split(":")[0]), expectedKeys);
    for (const key of expectedKeys) assert.equal(declarations.split(`${key}:`).length - 1, 1);
    assert.ok(declarations.endsWith(`color-scheme:${mode}`));
  }
  assert.equal(block(css, mediaSelector), block(css, darkSelector));
});

test("override light thắng theme và không đè dark", () => {
  const overrides: ThemeOverrides = { colors: { light: { primary: "1 2 3" } } };
  const css = themeToCss(t15, overrides);
  assert.match(block(css, lightSelector), /--c-primary:1 2 3;/);
  assert.doesNotMatch(block(css, lightSelector), /--c-primary:21 128 61;/);
  assert.match(block(css, darkSelector), /--c-primary:74 222 128;/);
  assert.equal(block(css, mediaSelector), block(css, darkSelector));
  assert.equal(overrides.colors?.light?.primary, "1 2 3");
  assert.equal(t15.colors.light.primary, "21 128 61");
});

test("override dark và kính thắng ở selector dark và media, không đổi light", () => {
  const css = themeToCss(t15, { colors: { dark: { primary: "4 5 6", glass: "rgba(1,2,3,0.5)" } } });
  assert.match(block(css, lightSelector), /--c-primary:21 128 61;/);
  for (const selector of [darkSelector, mediaSelector]) {
    assert.match(block(css, selector), /--c-primary:4 5 6;/);
    assert.match(block(css, selector), /--glass:rgba\(1,2,3,0\.5\);/);
    assert.doesNotMatch(block(css, selector), /--c-primary:74 222 128;/);
  }
});

test("override rỗng và thứ tự khóa input không thay đổi output", () => {
  assert.equal(themeToCss(t15, {}), themeToCss(t15));
  assert.equal(
    themeToCss(t15, { colors: { light: { primary: "1 2 3", bg: "4 5 6" } } }),
    themeToCss(t15, { colors: { light: { bg: "4 5 6", primary: "1 2 3" } } }),
  );
});

test("trường override optional bằng undefined giữ giá trị theme", () => {
  assert.equal(themeToCss(t15, { colors: { light: { primary: undefined }, dark: { glass: undefined } } }), themeToCss(t15));
});

test("override từ chối màu sai, CSS injection và khóa lạ ở mọi cấp", () => {
  for (const overrides of [
    { colors: { light: { primary: "red" } } },
    { colors: { light: { primary: "1 2 3}</style>" } } },
    { colors: { dark: { primary: "256 0 0" } } },
    { colors: { dark: { glass: "rgba(0,0,0,0.5);}</style>" } } },
    { colors: { light: { typo: "1 2 3" } } },
    { colors: { dark: { typo: "1 2 3" } } },
    { colors: { typo: {} } },
    { typo: true },
    null,
  ]) {
    assert.throws(() => themeToCss(t15, overrides as ThemeOverrides));
  }
});

test("easing không thể đóng style, khai báo hay selector", () => {
  for (const character of "<>{};") {
    const theme = { ...t15, motion: { ...t15.motion, easing: `ease${character}` } };
    assert.throws(() => themeToCss(theme), /easing/);
  }
});

test("theme không hỗ trợ dark chỉ sinh light, kể cả khi có override dark", () => {
  const theme = parseTheme({ ...t15, colors: { light: t15.colors.light }, meta: { ...t15.meta, supportsDark: false } });
  const css = themeToCss(theme, { colors: { dark: { primary: "1 2 3" } } });
  assert.doesNotMatch(css, /data-theme="dark"|@media|color-scheme:dark|--c-primary:1 2 3/);
});

test("dark partial giữ nguyên tập con; dark rỗng vẫn có color-scheme", () => {
  for (const dark of [{ primary: "4 5 6" }, {}]) {
    const theme = parseTheme({ ...t15, colors: { light: t15.colors.light, dark } });
    const css = themeToCss(theme);
    const expected = "primary" in dark ? "--c-primary:4 5 6;color-scheme:dark" : "color-scheme:dark";
    assert.equal(block(css, darkSelector), expected);
    assert.equal(block(css, mediaSelector), expected);
  }
});

test("sinh token không màu chỉ ở root, blur và reveal bằng 0 khi tắt", () => {
  const css = themeToCss(t15);
  const root = block(css, lightSelector);
  for (const [name, value] of Object.entries({
    "radius-card": "28px", "radius-pill": "9999px", "radius-media": "32px",
    "radius-input": "16px", "radius-button": "9999px", "shadow-strength": "1",
    "c-shadow-tint": "var(--c-shadow)", "glass-blur": "24px", "motion-fast": "300ms",
    "motion-base": "500ms", "motion-slow": "900ms", "motion-ease": "cubic-bezier(.16,1,.3,1)",
    "reveal-distance": "64px", container: "1280px",
  })) {
    assert.ok(root.includes(`--${name}:${value};`));
    assert.ok(!block(css, darkSelector).includes(`--${name}:`));
  }
  const disabled = themeToCss({ ...t15, glass: { ...t15.glass, enabled: false }, motion: { ...t15.motion, revealEnabled: false } });
  assert.match(disabled, /--glass-blur:0px;/);
  assert.match(disabled, /--reveal-distance:0px;/);
  assert.doesNotMatch(css, /--font-|--section/);
});

test("hai theme render xen kẽ không lẫn biến hay làm đổi dữ liệu", () => {
  const theme = parseTheme({
    ...t15, meta: { ...t15.meta, id: "second" },
    colors: { ...t15.colors, light: { ...t15.colors.light, primary: "1 2 3", bg: "4 5 6" } },
  });
  const original = structuredClone(theme);
  const firstCss = themeToCss(t15);
  const secondCss = themeToCss(theme);
  assert.doesNotMatch(secondCss, /--c-primary:21 128 61|245 250 246/);
  assert.equal(themeToCss(t15), firstCss);
  assert.equal(themeToCss(theme), secondCss);
  assert.deepEqual(theme, original);
});

test("CSS t15 không vượt quá 4 KB", () => {
  assert.ok(Buffer.byteLength(themeToCss(t15)) <= 4096);
});
