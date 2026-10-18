import { getTheme } from "@solar/themes";
import { themeAllowed } from "@solar/plans";
import type { TenantSite } from "./siteData";

export function applyPreviewTheme(site: TenantSite, themeId?: string): TenantSite {
  const theme = themeId ? getTheme(themeId) : undefined;
  if (!theme || !themeAllowed(site.entitlements.planId, theme.meta.group)) return site;
  return { ...site, theme, context: { ...site.context, themeId: theme.meta.id } };
}
