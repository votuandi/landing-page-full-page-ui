import { z } from "zod";
import type { Permission, Session } from "@solar/auth";
import { SiteSettingsError, type SiteSettingsPatch } from "@solar/db";
import { companyProfileSchema, mergeCompanyProfile } from "@solar/db/site-profile";
import type { ActionContext, ActionResult } from "./action.ts";
import { authorize } from "./gate.ts";

export type SettingsSite = { id: string; profile: unknown; themeOverrides: unknown; themeId: string; updatedAt: Date; locales: string[]; defaultLocale: string; planId: string };
export type SiteSettingsDeps = {
  requirePermission(permission: Permission): Promise<Session>;
  tenant(): Promise<{ tenantId: string; siteId: string }>;
  entitlements(): Promise<(feature: string) => boolean>;
  load(tenantId: string, siteId: string): Promise<SettingsSite | null>;
  save(tenantId: string, siteId: string, patch: SiteSettingsPatch, expected: Date): Promise<{ updatedAt: Date }>;
  preview(tenantId: string, siteId: string, slug: string): Promise<string>;
};
export const settingsPayloadSchema = z.object({ payload: z.string().max(500_000), updatedAt: z.iso.datetime() });
export type SettingsInput = z.output<typeof settingsPayloadSchema>;
export async function loadSiteSettings(permission: "settings.manage" | "theme.manage", deps: SiteSettingsDeps) {
  const session = await deps.requirePermission(permission);
  const tenant = await deps.tenant();
  const [site, can] = await Promise.all([deps.load(tenant.tenantId, tenant.siteId), deps.entitlements()]);
  if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
  return { site, can, session };
}
export async function settingsAction(permission: "settings.manage" | "theme.manage", input: SettingsInput, context: ActionContext, deps: SiteSettingsDeps,
  work: (data: unknown, site: SettingsSite, can: (feature: string) => boolean, save: (patch: SiteSettingsPatch) => Promise<ActionResult>) => Promise<ActionResult>): Promise<ActionResult> {
  authorize(context.session, context.tenantId, permission);
  try {
    const data: unknown = JSON.parse(input.payload), tenant = await deps.tenant();
    if (tenant.tenantId !== context.tenantId) throw new SiteSettingsError("Website không hợp lệ", 403);
    const [site, can] = await Promise.all([deps.load(context.tenantId, tenant.siteId), deps.entitlements()]);
    if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
    const save = async (patch: SiteSettingsPatch) => {
      const result = await deps.save(context.tenantId, tenant.siteId, patch, new Date(input.updatedAt));
      return { ok: true, message: "Đã lưu thay đổi", updatedAt: result.updatedAt.toISOString() };
    };
    return await work(data, site, can, save);
  } catch (error) {
    if (error instanceof SiteSettingsError) return { ok: false, status: error.status, error: error.message };
    if (error instanceof z.ZodError) return { ok: false, status: 400, error: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") };
    if (error instanceof SyntaxError) return { ok: false, status: 400, error: "Dữ liệu không hợp lệ" };
    throw error;
  }
}
const profileInput = z.strictObject({ profile: companyProfileSchema, locales: z.array(z.enum(["vi", "en"])).min(1).max(2), defaultLocale: z.enum(["vi", "en"]) });
export function createSiteSettingsHandlers(deps: SiteSettingsDeps) {
  return {
    profile: (input: SettingsInput, context: ActionContext) => settingsAction("settings.manage", input, context, deps, async (raw, site, can, save) => {
      const data = profileInput.parse(raw, { error: z.locales.vi().localeError });
      if (!data.locales.includes("vi") || !data.locales.includes(data.defaultLocale) || new Set(data.locales).size !== data.locales.length) throw new SiteSettingsError("Ngôn ngữ phải có tiếng Việt và chứa ngôn ngữ mặc định", 400);
      if (!can("bilingual") && data.locales.includes("en")) throw new SiteSettingsError("Gói hiện tại không hỗ trợ song ngữ", 403);
      return save({ profile: mergeCompanyProfile(site.profile, data.profile), locales: data.locales, defaultLocale: data.defaultLocale });
    }),
  };
}
