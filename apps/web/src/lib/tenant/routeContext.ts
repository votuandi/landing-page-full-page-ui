export type TenantLocale = "vi" | "en" | "auto";
export type TenantContext = { locale: TenantLocale; preview: boolean };

const locales: readonly string[] = ["vi", "en", "auto"];

/** Path segment the proxy writes so tenant pages never read cookies/headers while rendering (E5-S06). */
export const formatTenantContext = ({ locale, preview }: TenantContext) => `${preview ? "draft." : ""}${locale}`;

export function parseTenantContext(ctx: string): TenantContext | null {
  const preview = ctx.startsWith("draft.");
  const locale = preview ? ctx.slice(6) : ctx;
  return locales.includes(locale) ? { locale: locale as TenantLocale, preview } : null;
}

/** `solar-locale` cookie → requested locale; anything else lets the site default win. */
export const cookieLocale = (value: string | undefined): TenantLocale => value === "vi" || value === "en" ? value : "auto";
