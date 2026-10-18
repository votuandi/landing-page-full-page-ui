import assert from "node:assert/strict";
import { test } from "node:test";
import { getTheme } from "@solar/themes";
import { setup } from "./siteSettings.test.ts";

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
test("colors require themeOverride", async () => {
  const s = setup("owner", false);
  assert.equal((await s.actions.colors({}, s.form({}))).status, 403);
  assert.equal(s.writes(), 0);
});
test("theme outside plan is rejected", async () => {
  const s = setup(); s.setSite({ planId: "basic" });
  for (const action of [s.actions.theme, s.actions.preview]) {
    assert.equal((await action({}, s.form({ themeId: "t15" }))).status, 403);
    assert.equal((await action({}, s.form({ themeId: "unknown" }))).status, 400);
  }
  assert.equal(s.writes(), 0);
});
test("theme change rechecks overrides", async () => {
  const s = setup(); s.setSite({ themeOverrides: { colors: { light: { primary: getTheme("t14")!.colors.light["on-primary"] } } } });
  assert.equal((await s.actions.theme({}, s.form({ themeId: "t14" }))).status, 400);
  assert.equal(s.site().themeId, "t15"); assert.equal(s.writes(), 0);
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
