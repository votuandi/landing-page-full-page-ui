import { NextRequest, NextResponse } from "next/server";
import { normalizeHost } from "./host";
import type { HostLookup } from "./resolver";
import { previewSlug, previewCookieName, verifyPreviewCookie } from "./preview";
import { cookieLocale, formatTenantContext } from "./routeContext";
import { securityHeaders } from "../security/headers";
import { mediaOrigins } from "@solar/storage/media-origins";

/** Internal page path: tenant, site, locale and preview live in the URL so pages can be cached (E5-S06). */
export function tenantRewritePath(request: NextRequest, record: { tenantId: string; siteId: string }, preview: boolean) {
  const { pathname, search } = request.nextUrl;
  const base = `/sites/${encodeURIComponent(record.tenantId)}/${encodeURIComponent(record.siteId)}`;
  if (["/robots.txt", "/sitemap.xml", "/icon.png", "/apple-icon.png"].includes(pathname)) return `${base}${pathname}${search}`;
  return `${base}/${formatTenantContext({ locale: cookieLocale(request.cookies.get("solar-locale")?.value), preview })}${pathname}${search}`;
}

export function createProxy(resolver: { resolve: HostLookup }, { enabled, production = process.env.NODE_ENV === "production" }: { enabled: boolean; production?: boolean }) {
  return async function route(request: NextRequest) {
    const headers = new Headers(request.headers);
    headers.delete("x-tenant-id");
    headers.delete("x-site-id");
    headers.delete("x-preview");
    const { pathname, search } = request.nextUrl;
    const host = normalizeHost(headers.get("host"));
    const slug = host ? previewSlug(host) : null;
    const adminPort = !production ? process.env.ADMIN_PUBLIC_PORT ?? request.nextUrl.port : "";
    const frameAncestors = slug ? `${production ? "https:" : request.nextUrl.protocol}//${slug}.admin.${process.env.PLATFORM_DOMAIN}${adminPort ? `:${adminPort}` : ""}` : undefined;
    // Same gate as app/(site)/lab/layout.tsx: lab exists in dev or with LAB_ENABLED=true.
    const frameSelf = pathname.startsWith("/lab/") && (!production || process.env.LAB_ENABLED === "true");
    const responseHeaders = securityHeaders({ production, frameAncestors, mediaOrigins: mediaOrigins(), frameSelf });
    const secure = (response: NextResponse) => {
      for (const [key, value] of Object.entries(responseHeaders)) response.headers.set(key, value);
      if (slug) {
        response.headers.set("X-Robots-Tag", "noindex");
        response.headers.set("Cache-Control", "private, no-store");
      }
      return response;
    };
    const missing = () => secure(new NextResponse("Không tìm thấy website.", { status: 404, headers: { "Cache-Control": "no-store" } }));
    // Next decodes paths during routing: block encoded internal paths as well.
    let decoded: string;
    try { decoded = decodeURIComponent(pathname).toLowerCase(); } catch { return missing(); }
    if (decoded === "/sites" || decoded.startsWith("/sites/")) return missing();
    if (pathname === "/api/revalidate") return secure(NextResponse.next({ request: { headers } }));
    if (!enabled) return secure(NextResponse.next({ request: { headers } }));
    if (!host) return missing();
    let record: Awaited<ReturnType<HostLookup>>;
    try {
      record = await resolver.resolve(host);
    } catch (error) {
      console.error("Tenant resolution failed", { host }, error);
      return secure(new NextResponse("Website tạm thời không khả dụng.", { status: 503, headers: { "Cache-Control": "no-store" } }));
    }
    if (!record || !["verified", "active"].includes(record.status)) return missing();
    if (record.tenantStatus === "suspended") return secure(new NextResponse("Website tạm ngừng hoạt động.", {
      status: 403, headers: { "Cache-Control": "no-store" },
    }));
    if (slug) {
      headers.set("x-tenant-id", record.tenantId);
      headers.set("x-site-id", record.siteId);
      headers.set("x-preview", "1");
      if (pathname === "/api/preview") return secure(NextResponse.next({ request: { headers } }));
      if (!await verifyPreviewCookie(request.cookies.get(previewCookieName(production))?.value, record.tenantId, record.siteId)) {
        return secure(new NextResponse("Phiên xem trước đã hết hạn — mở lại từ trang quản trị.", { status: 401 }));
      }
      if (pathname === "/api" || pathname.startsWith("/api/")) return secure(NextResponse.next({ request: { headers } }));
      return secure(NextResponse.rewrite(new URL(tenantRewritePath(request, record, true), request.url), { request: { headers } }));
    }
    if (!record.isPrimary && record.primaryHost && record.primaryHost !== host) {
      const primary = normalizeHost(record.primaryHost);
      if (!primary || primary !== record.primaryHost) return missing();
      const protocol = production ? "https:" : request.nextUrl.protocol;
      const port = !production && request.nextUrl.port ? `:${request.nextUrl.port}` : "";
      return secure(NextResponse.redirect(new URL(`${protocol}//${primary}${port}${pathname}${search}`), {
        status: 308, headers: { "Cache-Control": "public, max-age=300" },
      }));
    }
    headers.set("x-tenant-id", record.tenantId);
    headers.set("x-site-id", record.siteId);
    if (pathname === "/api" || pathname.startsWith("/api/")) return secure(NextResponse.next({ request: { headers } }));
    // Keep Next's internal origin so this stays a local rewrite, even for custom Host.
    return secure(NextResponse.rewrite(new URL(tenantRewritePath(request, record, false), request.url), { request: { headers } }));
  };
}
