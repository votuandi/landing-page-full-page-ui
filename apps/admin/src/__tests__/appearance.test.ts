import assert from "node:assert/strict";
import { test } from "node:test";
import { getTheme } from "@solar/themes";
import { setup } from "./siteSettings.test.ts";

test("fonts rejects unknown family and missing weight", async () => {
  const s = setup();
  for (const sans of ["Comic Sans", 'Inter";}', "__proto__", ""]) {
    assert.equal((await s.actions.fonts({}, s.form({ sans }))).status, 400);
  }
  s.setSite({ themeId: "t01" });
  const result = await s.actions.fonts({}, s.form({ display: "Manrope" }));
  assert.equal(result.status, 400); assert.match(result.error!, /900/);
  assert.equal(s.writes(), 0);
});

test("fonts requires themeOverride and permission", async () => {
  for (const [role, enabled] of [["owner", false], ["viewer", true]] as const) {
    const s = setup(role, enabled);
    assert.equal((await s.actions.fonts({}, s.form({ sans: "Manrope" }))).status, 403);
    assert.equal(s.writes(), 0);
  }
});

test("fonts keeps colors and colors keeps font; empty fonts resets", async () => {
  const s = setup(), colors = { light: { primary: getTheme("t15")!.colors.light.primary } };
  s.setSite({ themeOverrides: { colors } });
  assert.equal((await s.actions.fonts({}, s.form({ sans: "Manrope" }))).ok, true);
  assert.deepEqual(s.site().themeOverrides, { colors, font: { sans: "Manrope" } });
  assert.equal((await s.actions.colors({}, s.form({}))).ok, true);
  assert.deepEqual(s.site().themeOverrides, { font: { sans: "Manrope" } });
  assert.equal((await s.actions.fonts({}, s.form({}))).ok, true);
  assert.deepEqual(s.site().themeOverrides, {});
});

test("theme and preview reject incompatible font before issuing token", async () => {
  const s = setup(); s.setSite({ themeOverrides: { font: { display: "Manrope" } } });
  let issued = 0; s.deps.preview = async () => { issued++; return "https://preview.localhost/"; };
  for (const action of [s.actions.theme, s.actions.preview]) {
    const result = await action({}, s.form({ themeId: "t01" }));
    assert.equal(result.status, 400); assert.match(result.error!, /900/); assert.match(result.error!, /Gợi ý/);
  }
  assert.equal(s.writes(), 0); assert.equal(issued, 0);
});

const faviconId = "e7070000-0000-4000-8000-000000000099";
test("favicon saves media id and preserves brand, accepts private for publish and clears", async () => {
  const s = setup("owner", false);
  s.deps.media = async (tenantId, id) => { assert.equal(tenantId, s.context.tenantId); assert.equal(id, faviconId); return { status: "ready", mime: "image/png" }; };
  s.setSite({ profile: { brand: { logo: "/logo.svg", tagline: "[DỮ LIỆU MẪU]" }, extra: true } });
  assert.equal((await s.actions.favicon({}, s.form({ favicon: faviconId }))).ok, true);
  assert.deepEqual(s.site().profile, { brand: { logo: "/logo.svg", tagline: "[DỮ LIỆU MẪU]", favicon: faviconId }, extra: true });
  assert.equal((await s.actions.favicon({}, s.form({ favicon: null }))).ok, true);
  assert.deepEqual(s.site().profile, { brand: { logo: "/logo.svg", tagline: "[DỮ LIỆU MẪU]" }, extra: true });
});

test("favicon rejects foreign media, invalid uuid, missing payload, non-ready and unsupported mime", async () => {
  const s = setup(); s.deps.media = async () => null;
  assert.equal((await s.actions.favicon({}, s.form({ favicon: faviconId }))).status, 404);
  for (const favicon of ["wrong", undefined, 1]) assert.equal((await s.actions.favicon({}, s.form({ favicon }))).status, 400);
  for (const media of [{ status: "quarantine", mime: "image/png" }, { status: "failed", mime: "image/png" }, { status: "ready", mime: "image/svg+xml" }]) {
    s.deps.media = async () => media;
    assert.equal((await s.actions.favicon({}, s.form({ favicon: faviconId }))).status, 400);
  }
  assert.equal(s.writes(), 0);
});

test("saveColors rejects low contrast", async () => {
  const s = setup();
  const result = await s.actions.colors({}, s.form({ colors: { light: { primary: getTheme("t15")!.colors.light["on-primary"] } } }));
  assert.equal(result.status, 400); assert.match(result.error!, /Gợi ý/); assert.equal(s.writes(), 0);
});
test("saveColors stores passing colors and clears empty", async () => {
  const s = setup(), colors = { light: { primary: getTheme("t15")!.colors.light.primary } };
  assert.equal((await s.actions.colors({}, s.form({ colors }))).ok, true);
  assert.deepEqual(s.site().themeOverrides, { colors });
  assert.equal((await s.actions.colors({}, s.form({}))).ok, true);
  assert.deepEqual(s.site().themeOverrides, {});
});
test("saveColors round-trip preserves non-brand overrides while editing and clearing brand colors", async () => {
  const s = setup(), theme = getTheme("t15")!;
  const other = { light: { bg: theme.colors.light.bg, glass: theme.colors.light.glass }, dark: { fg: theme.colors.dark!.fg } };
  const original = { colors: { light: { ...other.light, primary: theme.colors.light.primary }, dark: { ...other.dark, accent: theme.colors.dark!.accent ?? theme.colors.light.accent } } };
  s.setSite({ themeOverrides: original });
  assert.equal((await s.actions.colors({}, s.form(original))).ok, true);
  assert.deepEqual(s.site().themeOverrides, original);
  const edited = { colors: { light: { secondary: theme.colors.light.secondary } } };
  assert.equal((await s.actions.colors({}, s.form(edited))).ok, true);
  assert.deepEqual(s.site().themeOverrides, { colors: { light: { ...other.light, ...edited.colors.light }, dark: other.dark } });
  assert.equal((await s.actions.colors({}, s.form({}))).ok, true);
  assert.deepEqual(s.site().themeOverrides, { colors: other });
});
test("colors require themeOverride", async () => {
  const s = setup("owner", false);
  assert.equal((await s.actions.colors({}, s.form({}))).status, 403);
  assert.equal(s.writes(), 0);
});
test("theme outside plan is rejected", async () => {
  const s = setup(); s.setSite({ planId: "basic" });
  for (const action of [s.actions.theme]) {
    assert.equal((await action({}, s.form({ themeId: "t15" }))).status, 403);
    assert.equal((await action({}, s.form({ themeId: "unknown" }))).status, 400);
  }
  assert.equal(s.writes(), 0);
});

test("preview theme khóa vẫn tạo link nhưng không lưu", async () => {
  const s = setup("owner", false); s.setSite({ planId: "basic" });
  const result = await s.actions.preview({}, s.form({ themeId: "t15" }));
  assert.equal(result.ok, true); assert.equal(new URL(result.url!).searchParams.get("theme"), "t15");
  assert.equal(s.writes(), 0);
  assert.equal((await s.actions.preview({}, s.form({ themeId: "unknown" }))).status, 400);
});
test("theme change rechecks overrides", async () => {
  const s = setup(); s.setSite({ themeOverrides: { colors: { light: { primary: getTheme("t14")!.colors.light["on-primary"] } } } });
  assert.equal((await s.actions.theme({}, s.form({ themeId: "t14" }))).status, 400);
  assert.equal(s.site().themeId, "t15"); assert.equal(s.writes(), 0);
});
test("theme change ignores overrides without themeOverride", async () => {
  const s = setup("owner", false);
  const overrides = { colors: { light: { primary: getTheme("t02")!.colors.light["on-primary"] } } };
  s.setSite({ planId: "basic", themeOverrides: overrides });
  const preview = await s.actions.preview({}, s.form({ themeId: "t02" }));
  assert.equal(preview.ok, true);
  assert.equal(new URL(preview.url!).searchParams.get("theme"), "t02");
  assert.equal(s.writes(), 0);
  assert.equal((await s.actions.theme({}, s.form({ themeId: "t02" }))).ok, true);
  assert.equal(s.site().themeId, "t02");
  assert.deepEqual(s.site().themeOverrides, overrides);
});
test("preview rechecks current overrides before creating a token", async () => {
  const s = setup(); s.setSite({ themeOverrides: { colors: { light: { primary: getTheme("t14")!.colors.light["on-primary"] } } } });
  let issued = 0; s.deps.preview = async () => { issued++; return "http://preview.localhost/"; };
  assert.equal((await s.actions.preview({}, s.form({ themeId: "t14" }))).status, 400);
  assert.equal(issued, 0);
});
test("logos preserve all other profile data and reject unsafe assets", async () => {
  const s = setup(), before = s.site().profile;
  assert.equal((await s.actions.logos({}, s.form({ logo: "javascript:alert(1)" }))).status, 400);
  assert.equal((await s.actions.logos({}, s.form({ logo: "/logo.svg", logoDark: "/dark.svg" }))).ok, true);
  const value = s.site().profile as { brand: { logo: string } };
  assert.equal(value.brand.logo, "/logo.svg");
  assert.deepEqual({ ...value, brand: undefined }, { ...before as object, brand: undefined });
});
