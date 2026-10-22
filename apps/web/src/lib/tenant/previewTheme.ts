import { getTheme } from "@solar/themes";
import type { TenantSite } from "./siteData";

export function applyPreviewTheme(site: TenantSite, themeId?: string): TenantSite {
  const theme = themeId ? getTheme(themeId) : undefined;
  if (!theme) return site;
  return { ...site, theme, context: { ...site.context, themeId: theme.meta.id } };
}
