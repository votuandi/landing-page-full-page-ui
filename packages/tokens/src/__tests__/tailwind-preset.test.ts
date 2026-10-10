import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import loadConfig from "tailwindcss/loadConfig";
import preset from "../tailwind-preset";
import { COLOR_KEYS, GLASS_COLOR_KEYS } from "../schema";

test("Tailwind nạp cấu hình TypeScript của web qua jiti", async () => {
  const config = loadConfig(resolve(__dirname, "../../../../apps/web/tailwind.config.ts"));
  const result = await postcss([tailwindcss({
    ...config,
    content: [{ raw: "bg-primary/20 rounded-card" }],
    corePlugins: { preflight: false },
  })]).process("@tailwind utilities;", { from: undefined });
  assert.match(result.css, /rgb\(var\(--c-primary\) \/ 0\.2\)/);
  assert.match(result.css, /border-radius: var\(--radius-card\)/);
});

async function utilities(classes: string[]) {
  const result = await postcss([tailwindcss({
    presets: [preset],
    content: [{ raw: classes.join(" ") }],
    corePlugins: { preflight: false },
  })]).process("@tailwind utilities;", { from: undefined });
  const rules = new Map<string, Record<string, string>>();
  result.root.walkRules((rule) => {
    const declarations: Record<string, string> = {};
    rule.walkDecls((declaration) => { declarations[declaration.prop] = declaration.value; });
    rules.set(rule.selector, declarations);
  });
  return rules;
}

test("màu mặc định không sinh CSS; opacity và mọi màu token dùng đúng biến", async () => {
  const forbidden = ["bg-white", "text-slate-500", "bg-red-500", "border-gray-200"];
  const rules = await utilities([
    ...forbidden, ...COLOR_KEYS.map((key) => `bg-${key}`),
    ...GLASS_COLOR_KEYS.map((key) => `bg-${key}`),
    "bg-primary/20", "text-fg-muted", "bg-transparent", "bg-current", "bg-inherit",
  ]);
  for (const name of forbidden) assert.ok(!rules.has(`.${name}`), name);
  for (const key of COLOR_KEYS) {
    assert.equal(rules.get(`.bg-${key}`)?.["background-color"], `rgb(var(--c-${key}) / var(--tw-bg-opacity, 1))`);
  }
  for (const key of GLASS_COLOR_KEYS) {
    assert.equal(rules.get(`.bg-${key}`)?.["background-color"], `var(--${key})`);
  }
  assert.equal(rules.get(".bg-primary\\/20")?.["background-color"], "rgb(var(--c-primary) / 0.2)");
  assert.equal(rules.get(".text-fg-muted")?.color, "rgb(var(--c-fg-muted) / var(--tw-text-opacity, 1))");
  assert.equal(rules.get(".bg-transparent")?.["background-color"], "transparent");
  assert.equal(rules.get(".bg-current")?.["background-color"], "currentColor");
  assert.equal(rules.get(".bg-inherit")?.["background-color"], "inherit");
});

test("utility radius, shadow, kính, motion, spacing và font đọc token", async () => {
  const radii = ["card", "pill", "media", "input", "button"];
  const shadows = ["sm", "lg", "xl", "2xl"];
  const durations = ["fast", "base", "slow"];
  const rules = await utilities([
    ...radii.map((key) => `rounded-${key}`), ...shadows.map((key) => `shadow-${key}`),
    ...durations.map((key) => `duration-motion-${key}`),
    "backdrop-blur-glass", "py-section", "font-sans", "font-display", "rounded-3xl",
  ]);
  for (const key of radii) assert.equal(rules.get(`.rounded-${key}`)?.["border-radius"], `var(--radius-${key})`);
  for (const key of shadows) {
    const shadow = rules.get(`.shadow-${key}`)?.["--tw-shadow"] ?? "";
    assert.match(shadow, /rgb\(var\(--c-shadow\) \/ calc\(/);
    assert.match(shadow, /var\(--shadow-strength\)/);
  }
  for (const key of durations) assert.equal(rules.get(`.duration-motion-${key}`)?.["transition-duration"], `var(--motion-${key})`);
  assert.equal(rules.get(".backdrop-blur-glass")?.["--tw-backdrop-blur"], "blur(var(--glass-blur))");
  assert.equal(rules.get(".py-section")?.["padding-top"], "var(--section-y)");
  assert.equal(rules.get(".py-section")?.["padding-bottom"], "var(--section-y)");
  assert.equal(rules.get(".font-sans")?.["font-family"], "var(--font-sans), system-ui, sans-serif");
  assert.equal(rules.get(".font-display")?.["font-family"], "var(--font-display, var(--font-sans)), system-ui, sans-serif");
  // Giữ thang radius mặc định tới khi port section đổi class có chủ đích.
  assert.equal(rules.get(".rounded-3xl")?.["border-radius"], "1.5rem");
});
