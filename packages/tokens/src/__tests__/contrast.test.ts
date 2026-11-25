import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { AA_NORMAL, CONTRAST_PAIRS, checkContrast, contrastRatio, suggestAccessible, validateBrandOverrides } from "../index";
import { parseTheme, RgbChannels } from "../schema";
import { t15 } from "./fixtures/t15";

test("validateBrandOverrides rejects with passing suggestion", () => {
  const issues = validateBrandOverrides(parseTheme(t15), { colors: { light: { primary: t15.colors.light["on-primary"] } } });
  const issue = issues.find(i => i.key === "primary" && i.mode === "light");
  assert.ok(issue);
  assert.ok(contrastRatio(issue.suggestion, t15.colors.light["on-primary"]) >= 4.5);
  assert.deepEqual(validateBrandOverrides(parseTheme(t15), {}), []);
});

test("WCAG ratio is symmetric, unrounded, and matches known colors", () => {
  assert.equal(AA_NORMAL, 4.5);
  assert.equal(contrastRatio("0 0 0", "255 255 255"), 21);
  assert.equal(contrastRatio("118 118 118", "118 118 118"), 1);
  const ratio = contrastRatio("118 118 118", "255 255 255");
  assert.ok(Math.abs(ratio - 4.54) < 0.01);
  assert.equal(ratio, contrastRatio("255 255 255", "118 118 118"));
  assert.ok(contrastRatio("119 119 119", "255 255 255") < AA_NORMAL);
});

test("ratio and suggestions reject malformed RGB channels", () => {
  for (const value of ["256 0 0", "-1 0 0", "1 2", "1.5 2 3", "#ffffff"]) {
    assert.throws(() => contrastRatio(value, "0 0 0"));
    assert.throws(() => contrastRatio("0 0 0", value));
    assert.throws(() => suggestAccessible(value, "0 0 0"));
    assert.throws(() => suggestAccessible("0 0 0", value));
  }
});

test("suggestion preserves accessible input and darkens or lightens only as needed", () => {
  assert.equal(suggestAccessible("000 000 000", "255 255 255"), "000 000 000");
  for (const [color, against, direction, min] of [
    ["200 200 200", "255 255 255", -1, 4.5],
    ["40 40 40", "0 0 0", 1, 4.5],
    ["200 200 200", "255 255 255", -1, 7],
    ["110 110 110", "118 118 118", -1, 4.5],
  ] as const) {
    const suggestion = suggestAccessible(color, against, min);
    assert.equal(RgbChannels.parse(suggestion), suggestion);
    assert.ok(contrastRatio(suggestion, against) >= min);
    assert.ok((Number(suggestion.split(" ")[0]) - Number(color.split(" ")[0])) * direction > 0);
  }
  assert.equal(suggestAccessible("200 200 200", "255 255 255"), "118 118 118");
  assert.equal(suggestAccessible("40 40 40", "0 0 0"), "117 117 117");
});

test("unreachable contrast uses the better black or white endpoint", () => {
  assert.equal(suggestAccessible("200 100 50", "255 255 255", 22), "0 0 0");
  assert.equal(suggestAccessible("200 100 50", "0 0 0", 22), "255 255 255");
});

test("t15 passes every required pair in light and dark", () => {
  assert.equal(CONTRAST_PAIRS.length, 29);
  assert.deepEqual(checkContrast(parseTheme(t15)), []);
});

test("pairs without tint keep previous ratios", () => {
  const theme = parseTheme(t15);
  const issue = checkContrast(theme, { colors: { light: { "fg-muted": "200 200 200" } } })
    .find(item => item.mode === "light" && item.fg === "fg-muted" && item.bg === "bg-tint");
  assert.ok(issue);
  assert.equal(issue.ratio, contrastRatio("200 200 200", theme.colors.light["bg-tint"]));
});

test("primary text pair uses dark colors", () => {
  const theme = parseTheme(t15);
  const primary = "40 50 45";
  const bg = "10 20 15";
  const issue = checkContrast(theme, { colors: { light: { primary: "120 200 120" }, dark: { primary, bg } } })
    .find(item => item.mode === "dark" && item.fg === "primary" && item.bg === "bg");
  assert.ok(issue);
  assert.equal(issue.ratio, contrastRatio(primary, "12 22 17"));
  assert.ok(!checkContrast(theme, { colors: { dark: { primary: issue.suggestion, bg } } })
    .some(item => item.mode === "dark" && item.fg === "primary" && item.bg === "bg"));
  assert.deepEqual(CONTRAST_PAIRS.filter(pair => pair.fg === "primary").map(pair => pair.bg),
    ["bg", "bg-elevated", "bg-tint", "bg-sky", "bg-sun"]);
});

test("unreachable tinted contrast still returns issues without looping", () => {
  const output = execFileSync(process.execPath, ["-e", `
    const { checkContrast, parseTheme } = require("../index.js");
    const { t15 } = require("./fixtures/t15.js");
    console.log(JSON.stringify(checkContrast(parseTheme(t15), {
      colors: { light: { primary: "0 0 0", bg: "118 118 118" } }
    })));
  `], { cwd: __dirname, timeout: 3000, encoding: "utf8" });
  const issues = JSON.parse(output) as ReturnType<typeof checkContrast>;
  assert.ok(issues.some(item => item.mode === "light" && item.fg === "primary" && item.bg === "bg" && item.ratio < AA_NORMAL));
});

test("primary as text on surfaces is checked for overrides", () => {
  const theme = parseTheme(t15);
  for (const primary of ["120 200 120", "35 130 65", "21 128 61"]) {
    const overrides = { colors: { light: { primary } } };
    if (primary === "35 130 65") assert.ok(contrastRatio(primary, theme.colors.light["on-primary"]) >= AA_NORMAL);
    const issues = checkContrast(theme, overrides).filter(item => item.mode === "light" && item.fg === "primary");
    const issue = issues.reduce((worst, item) => item.ratio < worst.ratio ? item : worst);
    assert.ok(issue);
    assert.ok(validateBrandOverrides(theme, overrides).some(item => item.mode === "light" && item.key === "primary" && item.suggestion === issue.suggestion));
    const corrected = checkContrast(theme, { colors: { light: { primary: issue.suggestion } } });
    assert.ok(!corrected.some(item => item.mode === "light" && (item.fg === "primary" || item.bg === "primary")));
    for (const item of issues) {
      assert.ok(!checkContrast(theme, { colors: { light: { primary: item.suggestion } } })
        .some(next => next.mode === "light" && next.fg === "primary" && next.bg === item.bg));
    }
  }
});

test("light overrides produce actionable issues but explicit dark tokens win", () => {
  const theme = parseTheme(t15);
  const snapshot = structuredClone(theme);
  const overrides = { colors: { light: { "fg-subtle": "200 200 200" } } };
  const issues = checkContrast(theme, overrides);
  assert.equal(issues.length, 5);
  for (const issue of issues) {
    assert.equal(issue.mode, "light");
    assert.equal(issue.fg, "fg-subtle");
    assert.equal(issue.min, AA_NORMAL);
    assert.ok(issue.ratio < issue.min);
    assert.ok(contrastRatio(issue.suggestion, theme.colors.light[issue.bg]) >= issue.min);
  }
  assert.deepEqual(theme, snapshot);
  assert.deepEqual(overrides, { colors: { light: { "fg-subtle": "200 200 200" } } });
  delete theme.colors.dark!["fg-subtle"];
  // The light gray remains readable on dark backgrounds; a darker override exposes inheritance.
  assert.ok(checkContrast(theme, { colors: { light: { "fg-subtle": "40 40 40" } } })
    .some((issue) => issue.mode === "dark" && issue.fg === "fg-subtle"));
});

test("dark overrides win and scrim issues use the worse composite background", () => {
  const issues = checkContrast(parseTheme(t15), {
    colors: { light: { "on-media": "255 255 255" }, dark: { "on-media": "102 102 102", scrim: "0 0 0" } },
  });
  const issue = issues.find((item) => item.mode === "dark" && item.fg === "on-media");
  assert.ok(issue);
  assert.equal(issue.bg, "scrim");
  assert.equal(issue.scrimAlpha, 0.6);
  assert.equal(issue.ratio, 1); // black scrim over white composites to 102 102 102
  assert.ok(contrastRatio(issue.suggestion, "102 102 102") >= AA_NORMAL);
  const whiteScrim = checkContrast(parseTheme(t15), {
    colors: { light: { "on-media": "153 153 153", scrim: "255 255 255" } },
  }).find((item) => item.mode === "light" && item.fg === "on-media");
  assert.ok(whiteScrim);
  assert.equal(whiteScrim.ratio, 1); // white scrim over black composites to 153 153 153
  assert.ok(contrastRatio(whiteScrim.suggestion, "153 153 153") >= AA_NORMAL);
});

test("themes without dark support only check light, and invalid overrides throw", () => {
  const theme = parseTheme(t15);
  theme.meta.supportsDark = false;
  delete theme.colors.dark;
  assert.ok(checkContrast(theme, { colors: { light: { fg: "200 200 200" } } })
    .every((issue) => issue.mode === "light"));
  assert.throws(() => checkContrast(theme, { colors: { light: { fg: "256 0 0" } } }));
  assert.throws(() => checkContrast(theme, JSON.parse('{"colors":{"light":{"unknown":"0 0 0"}}}')));
});
