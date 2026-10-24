import { z } from "zod";
import { tenantTag } from "@solar/cache";
import type { Db, PlatformDb } from "./client.ts";
import { siteProfileSchema, siteProfileMediaIds } from "./siteProfile.ts";
import { publishMedia } from "./media.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { enqueueInvalidate } from "./invalidate.ts";

export class SiteSettingsError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409) { super(message); this.name = "SiteSettingsError"; }
}
const patchSchema = z.strictObject({
  profile: siteProfileSchema.optional(), locales: z.array(z.enum(["vi", "en"])).min(1).max(2).optional(),
  defaultLocale: z.enum(["vi", "en"]).optional(), themeId: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
  themeOverrides: z.record(z.string(), z.unknown()).optional(),
});
export type SiteSettingsPatch = Omit<z.input<typeof patchSchema>, "profile"> & { profile?: unknown };
export async function saveSiteSettings(db: Db | PlatformDb, tenantId: string, siteId: string, patch: SiteSettingsPatch, expectedUpdatedAt?: Date) {
  const parsed = patchSchema.safeParse(patch, { error: z.locales.vi().localeError });
  if (!parsed.success) throw new SiteSettingsError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "), 400);
  return withTenantTransaction(db, tenantId, async repo => {
    const site = await repo.site.get(siteId);
    if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
    const conflict = () => new SiteSettingsError("Dữ liệu vừa thay đổi. Vui lòng tải lại trang trước khi lưu.", 409);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== site.updatedAt.getTime()) throw conflict();
    const locales = parsed.data.locales ?? site.locales, locale = parsed.data.defaultLocale ?? site.defaultLocale;
    if (!locales.includes("vi") || !locales.includes(locale) || new Set(locales).size !== locales.length) throw new SiteSettingsError("Ngôn ngữ phải có tiếng Việt và chứa ngôn ngữ mặc định", 400);
    // Validate the profile, but retain unknown keys for other editors/importers.
    const value = { ...parsed.data, ...(patch.profile ? { profile: patch.profile } : {}) };
    const saved = await repo.site.update(siteId, value as Parameters<typeof repo.site.update>[1], { updatedAt: site.updatedAt });
    if (!saved.count) throw conflict();
    const updated = (await repo.site.get(siteId))!;
    await publishMedia(repo, siteProfileMediaIds(updated.profile));
    await enqueueInvalidate(repo, [tenantTag(tenantId)]);
    return updated;
  });
}
