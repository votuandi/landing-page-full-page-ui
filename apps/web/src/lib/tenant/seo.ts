import { z } from "zod";
import { normalizeVnPhone } from "@solar/core";
import type { BranchItem } from "@solar/sections";

type OriginSite = { primaryHost: string };
export function siteOrigin(site: OriginSite, { production = process.env.NODE_ENV === "production", port = process.env.TENANT_PUBLIC_PORT ?? "" } = {}) {
  return `${production ? "https" : "http"}://${site.primaryHost}${!production && /^\d{1,5}$/.test(port) ? `:${port}` : ""}`;
}

// Preview subdomains (NOINDEX_DOMAINS, comma separated, e.g. preview.minwysoft.com) must never be indexed.
// A platform subdomain that is a site's primary host is indexed (D21); non-primary hosts already 308 (E5-S03).
export function isNoindexHost(host: string, suffixes = (process.env.NOINDEX_DOMAINS ?? "").split(",")) {
  return suffixes.map((suffix) => suffix.trim().toLowerCase().replace(/^\.+|\.+$/g, "")).filter(Boolean)
    .some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

// Same-site paths only: no scheme, host or protocol-relative target.
const sitePath = z.string().max(500).regex(/^\/(?![/\\])[^\s?#\\]*$/);
export const redirectRule = z.object({ from: sitePath, to: sitePath });
export type RedirectRule = z.output<typeof redirectRule>;
export function matchRedirect(rules: RedirectRule[], path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  for (const rule of rules) {
    const pattern = rule.from.split("/").filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (!pattern.every((part, index) => part.startsWith(":") ? (params[part.slice(1)] = parts[index], true) : part === parts[index])) continue;
    const to = rule.to.replace(/:([a-z][a-z0-9_]*)/gi, (match, name: string) => params[name] ?? match);
    if (to !== path) return to;
  }
  return null;
}

export function robotsTxt(origin: string, noindex: boolean) {
  // A noindex host stays crawlable so bots can read its noindex meta tag.
  return ["User-agent: *", "Allow: /", "Disallow: /api/", ...(noindex ? [] : ["", `Sitemap: ${origin}/sitemap.xml`]), ""].join("\n");
}
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
export function sitemapXml(origin: string, paths: string[]) {
  const urls = [...new Set(paths)].map((path) => `<url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>\n`;
}
export function sitemapPaths({ pages, products, services, projects, posts, policies }: {
  pages: string[]; products: string[]; services: string[]; projects: string[]; posts: string[]; policies: string[];
}) {
  const list = (prefix: string, slugs: string[]) => slugs.length ? [`/${prefix}`, ...slugs.map((slug) => `/${prefix}/${slug}`)] : [];
  return [...pages.map((slug) => `/${slug}`), ...list("san-pham", products), ...list("giai-phap", services),
    ...projects.map((slug) => `/cong-trinh/${slug}`), ...list("tin-tuc", posts), ...policies.map((slug) => `/chinh-sach/${slug}`)];
}

const absolute = (origin: string, src?: string) => src && (src.startsWith("/") || src.startsWith("https://")) ? new URL(src, origin).toString() : undefined;
const tel = (phone: string) => `+84${normalizeVnPhone(phone).replace(/^0/, "")}`;
export function organizationJsonLd(origin: string, org: { name: string; description?: string; email?: string; hotline?: string; logo?: string }, branches: BranchItem[]) {
  const id = `${origin}/#organization`;
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": id, name: org.name, url: `${origin}/`, logo: absolute(origin, org.logo ?? "/favicon.svg"),
      description: org.description || undefined, email: org.email, telephone: org.hotline ? tel(org.hotline) : undefined,
      department: branches.map((branch) => ({ "@id": `${origin}/#branch-${branch.id}` })) },
    ...branches.map((branch) => ({ "@type": "LocalBusiness", "@id": `${origin}/#branch-${branch.id}`, name: `${org.name} – ${branch.name}`,
      parentOrganization: { "@id": id }, url: `${origin}/`, telephone: tel(branch.hotline), email: org.email, openingHours: branch.hours,
      address: { "@type": "PostalAddress", streetAddress: branch.office.address, addressCountry: "VN" },
      geo: { "@type": "GeoCoordinates", latitude: branch.office.lat, longitude: branch.office.lng } })),
  ] };
}
export function productJsonLd(origin: string, url: string, item: { name: string; brand: string; images: string[]; specs: Record<string, string>; price?: number; salePrice?: number }) {
  const price = item.salePrice ?? item.price;
  return { "@context": "https://schema.org", "@type": "Product", name: item.name, url: new URL(url, origin).toString(),
    image: item.images.map((src) => absolute(origin, src)).filter(Boolean), brand: { "@type": "Brand", name: item.brand },
    description: Object.entries(item.specs).map(([key, value]) => `${key}: ${value}`).join(". ") || item.name,
    ...(price ? { offers: { "@type": "Offer", url: new URL(url, origin).toString(), priceCurrency: "VND", price, availability: "https://schema.org/InStock" } } : {}) };
}
export function breadcrumbJsonLd(origin: string, items: [name: string, path: string][]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], index) => ({
    "@type": "ListItem", position: index + 1, name, item: new URL(path, origin).toString() })) };
}
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({
    "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
}
