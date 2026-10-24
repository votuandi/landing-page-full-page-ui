import { createAppearanceHandlers } from "./appearance.ts";
import { siteSettingsDeps } from "./siteSettingsRuntime.ts";
import { forTenant } from "@solar/db";
import { getRuntime } from "./runtime.ts";
export const appearanceDeps = {
  ...siteSettingsDeps,
  media: (tenantId: string, id: string) => forTenant(getRuntime().db, tenantId).media.get(id),
  images: (tenantId: string) => forTenant(getRuntime().db, tenantId).media.list({ where: { status: "ready", mime: { startsWith: "image/" } }, orderBy: { createdAt: "desc" }, take: 60 }),
};
export const appearanceHandlers = createAppearanceHandlers(appearanceDeps);
