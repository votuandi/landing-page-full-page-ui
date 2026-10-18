import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as jsxRuntime from "react/jsx-runtime";
import * as profileSchemas from "@solar/db/site-profile";
import { ThemeOverridesSchema } from "@solar/tokens";
import ts from "typescript";
import * as settings from "../lib/siteSettings.ts";
import { setup } from "./siteSettings.test.ts";

async function pageProps(page: "cai-dat" | "giao-dien", s: ReturnType<typeof setup>) {
  const source = readFileSync(new URL(`../app/(admin)/${page}/page.tsx`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const imports: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "@solar/db/site-profile": profileSchemas,
    "@solar/tokens": { ThemeOverridesSchema },
    "../../../lib/siteSettings.ts": settings,
    "../../../lib/siteSettingsRuntime.ts": { siteSettingsDeps: s.deps },
    "../../../components/SiteProfileForm.tsx": { SiteProfileForm: () => null },
    "../../../components/AppearanceForm.tsx": { AppearanceForm: () => null },
  };
  const exports = {} as { default: () => Promise<{ props: Record<string, unknown> }> };
  new Function("require", "exports", compiled)((name: string) => {
    assert.ok(name in imports, `Unexpected import ${name}`);
    return imports[name];
  }, exports);
  return (await exports.default()).props;
}

test("company settings falls back with a Vietnamese warning for invalid saved profile", async () => {
  for (const profile of [null, [], { hotline: "invalid" }, { brand: { url: "http://old.example" } }]) {
    const s = setup(); s.setSite({ profile });
    const props = await pageProps("cai-dat", s);
    assert.deepEqual(props.initial, profileSchemas.companyProfileSchema.parse({}));
    assert.match(String(props.warning), /Thông tin công ty.*không hợp lệ.*mặc định/);
    assert.equal(s.writes(), 0);
  }
});

test("appearance falls back independently for invalid saved profile and overrides", async () => {
  const validProfile = profileSchemas.siteProfileSchema.parse({ brand: { logo: "/logo.svg", logoDark: "/dark.svg" } });
  const validOverrides = { colors: { light: { bg: "1 2 3" } } };
  for (const [profile, themeOverrides] of [
    [{ hotline: "invalid" }, validOverrides],
    [validProfile, { colors: { light: { primary: "invalid" } } }],
    [null, null],
  ]) {
    const s = setup(); s.setSite({ profile, themeOverrides });
    const props = await pageProps("giao-dien", s);
    const profileValid = profileSchemas.siteProfileSchema.safeParse(profile).success;
    const overridesValid = ThemeOverridesSchema.safeParse(themeOverrides).success;
    assert.equal(props.logo, profileValid ? "/logo.svg" : undefined);
    assert.equal(props.logoDark, profileValid ? "/dark.svg" : undefined);
    assert.deepEqual(props.overrides, overridesValid ? validOverrides : {});
    if (!profileValid) assert.match(String(props.warning), /Thông tin công ty.*không hợp lệ/);
    if (!overridesValid) assert.match(String(props.warning), /Màu tùy chỉnh.*không hợp lệ/);
    assert.match(String(props.warning), /mặc định/);
    assert.equal(s.writes(), 0);
  }
});

test("settings pages keep valid saved values without a warning", async () => {
  const s = setup();
  s.setSite({ profile: profileSchemas.siteProfileSchema.parse({ name: "[DỮ LIỆU MẪU]", brand: { logo: "/logo.svg" } }), themeOverrides: { colors: { light: { bg: "1 2 3" } } } });
  const company = await pageProps("cai-dat", s), appearance = await pageProps("giao-dien", s);
  assert.deepEqual(company.initial, profileSchemas.companyProfileSchema.parse(s.site().profile));
  assert.equal(appearance.logo, "/logo.svg");
  assert.deepEqual(appearance.overrides, s.site().themeOverrides);
  assert.ok(!company.warning); assert.ok(!appearance.warning);
  assert.equal(s.writes(), 0);
});
