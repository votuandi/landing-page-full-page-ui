import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { siteProfileSchema } from "@solar/db/site-profile";
import { createAction, type ActionContext } from "../lib/action.ts";
import { createAppearanceHandlers } from "../lib/appearance.ts";
import type { AppearanceDeps } from "../lib/appearance.ts";
import { createSiteSettingsHandlers, loadSiteSettings, settingsPayloadSchema, type SiteSettingsDeps, type SettingsSite } from "../lib/siteSettings.ts";

export function setup(role: "owner" | "admin" | "editor" | "viewer" = "owner", enabled = true) {
  let reads = 0, writes = 0;
  const tenantId = "e7070000-0000-4000-8000-000000000001", siteId = "e7070000-0000-4000-8000-000000000002";
  const session: Session = { id: "session", accountId: siteId, tenantId, realm: "site", audience: "admin", kind: "user", role, permissions: effectivePermissions({ role, audience: "admin" }), expiresAt: new Date(Date.now() + 10000), mustChangePassword: false };
  const context: ActionContext = { tenantId, slug: "mau", session };
  let site: SettingsSite = { id: siteId, planId: "premium", profile: { ...siteProfileSchema.parse({}), extra: { keep: 1 }, theme: { default: "dark", switcher: true } }, themeId: "t15", themeOverrides: {}, updatedAt: new Date(), locales: ["vi"], defaultLocale: "vi" };
  const deps: AppearanceDeps = {
    media: async () => null,
    requirePermission: async permission => { if (!session.permissions.has(permission)) throw Object.assign(new Error("Forbidden"), { status: 403 }); return session; },
    tenant: async () => ({ tenantId, siteId }), entitlements: async () => () => enabled,
    load: async () => { reads++; return site; },
    save: async (_tenantId, _siteId, patch) => { writes++; site = { ...site, ...patch, updatedAt: new Date(site.updatedAt.getTime() + 1) } as SettingsSite; return site; },
    preview: async () => "http://mau.preview.solar.localhost/api/preview?token=token&path=%2F",
  };
  const handlers = { ...createSiteSettingsHandlers(deps), ...createAppearanceHandlers(deps) }, action = createAction(async () => context);
  const actions = {
    profile: action("settings.manage", settingsPayloadSchema, handlers.profile),
    theme: action("theme.manage", settingsPayloadSchema, handlers.theme),
    colors: action("theme.manage", settingsPayloadSchema, handlers.colors),
    fonts: action("theme.manage", settingsPayloadSchema, handlers.fonts),
    favicon: action("theme.manage", settingsPayloadSchema, handlers.favicon),
    logos: action("theme.manage", settingsPayloadSchema, handlers.logos),
    preview: action("theme.manage", settingsPayloadSchema, handlers.preview),
  };
  const form = (payload: unknown) => { const f = new FormData(); f.set("payload", JSON.stringify(payload)); f.set("updatedAt", site.updatedAt.toISOString()); return f; };
  return { deps, handlers, actions, form, context, site: () => site, setSite: (next: Partial<SettingsSite>) => { site = { ...site, ...next }; }, reads: () => reads, writes: () => writes };
}
test("save keeps non-company profile keys", async () => {
  const s = setup();
  s.setSite({ profile: { ...siteProfileSchema.parse({
    name: "[DỮ LIỆU MẪU]", theme: { default: "dark", switcher: true },
    guide: { items: [{ id: "huong-dan", label: "Hướng dẫn" }] },
    team: [{ name: "[DỮ LIỆU MẪU] Kỹ sư", role: "Kỹ sư", image: "/team.jpg" }],
    timeline: [["2020", "[DỮ LIỆU MẪU] Thành lập", "Nội dung"]],
    legal: { policies: [{ slug: "bao-mat", title: "Bảo mật", summary: "Tóm tắt", body: { vi: [{ type: "paragraph", children: [{ type: "text", text: "Chính sách" }] }] } }] },
  }), extra: { keep: true } } });
  const before = s.site().profile as ReturnType<typeof siteProfileSchema.parse>;
  const { companyProfileSchema } = await import("@solar/db/site-profile");
  assert.equal((await s.actions.profile({}, s.form({ profile: companyProfileSchema.parse(before), locales: ["vi"], defaultLocale: "vi" }))).ok, true);
  for (const key of ["guide", "team", "timeline", "theme", "extra"] as const) assert.deepEqual((s.site().profile as Record<string, unknown>)[key], (before as Record<string, unknown>)[key]);
  assert.deepEqual((s.site().profile as typeof before).legal.policies, before.legal.policies);
});
test("permission is checked before loading", async () => {
  for (const [role, permission] of [["editor", "settings.manage"], ["viewer", "theme.manage"]] as const) {
    const s = setup(role);
    await assert.rejects(loadSiteSettings(permission, s.deps));
    assert.equal((await s.actions[role === "editor" ? "profile" : "theme"]({}, s.form({}))).status, 403);
    assert.equal(s.reads(), 0); assert.equal(s.writes(), 0);
  }
});
test("locales follow bilingual entitlement", async () => {
  const s = setup("owner", false), { companyProfileSchema } = await import("@solar/db/site-profile");
  const profile = companyProfileSchema.parse(s.site().profile);
  assert.equal((await s.actions.profile({}, s.form({ profile, locales: ["vi", "en"], defaultLocale: "vi" }))).status, 403);
  assert.equal((await s.actions.profile({}, s.form({ profile, locales: ["en"], defaultLocale: "en" }))).status, 400);
  assert.equal(s.writes(), 0);
});
