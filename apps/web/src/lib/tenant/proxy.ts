import { NextRequest, NextResponse } from "next/server";
import { normalizeHost } from "./host";
import type { HostLookup } from "./resolver";
import { previewSlug, previewCookieName, verifyPreviewCookie } from "./preview";

export function createProxy(resolver: { resolve: HostLookup }, { enabled, production = process.env.NODE_ENV === "production" }: { enabled: boolean; production?: boolean }) {
  return async function route(request: NextRequest) {
    const headers = new Headers(request.headers);
    headers.delete("x-tenant-id");
    headers.delete("x-site-id");
    headers.delete("x-preview");
    const { pathname, search } = request.nextUrl;
    const missing = () => new NextResponse("Không tìm thấy website.", { status: 404, headers: { "Cache-Control": "no-store" } });
    // Next decodes paths during routing: block encoded internal paths as well.
    let decoded: string;
    try { decoded = decodeURIComponent(pathname).toLowerCase(); } catch { return missing(); }
    if (decoded === "/sites" || decoded.startsWith("/sites/")) return missing();
    if (pathname === "/api/revalidate") return NextResponse.next({ request: { headers } });
    if (!enabled) return NextResponse.next({ request: { headers } });
    const host = normalizeHost(headers.get("host"));
    if (!host) return missing();
    const slug = previewSlug(host);
    const previewHeaders = slug ? {
      "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store",
      "Content-Security-Policy": `frame-ancestors ${production ? "https:" : request.nextUrl.protocol}//${slug}.admin.${process.env.PLATFORM_DOMAIN}${!production && request.nextUrl.port ? `:${request.nextUrl.port}` : ""}`,
    } : undefined;
    const protect = (response: NextResponse) => {
      for (const [key, value] of Object.entries(previewHeaders ?? {})) response.headers.set(key, value);
      return response;
    };
    let record: Awaited<ReturnType<HostLookup>>;
    try {
      record = await resolver.resolve(host);
    } catch (error) {
      console.error("Tenant resolution failed", { host }, error);
      return protect(new NextResponse("Website tạm thời không khả dụng.", { status: 503, headers: { "Cache-Control": "no-store" } }));
    }
    if (!record || !["verified", "active"].includes(record.status)) return protect(missing());
    if (record.tenantStatus === "suspended") return protect(new NextResponse("Website tạm ngừng hoạt động.", {
      status: 403, headers: { "Cache-Control": "no-store" },
    }));
    if (slug) {
      headers.set("x-tenant-id", record.tenantId);
      headers.set("x-site-id", record.siteId);
      headers.set("x-preview", "1");
      if (pathname === "/api/preview") return protect(NextResponse.next({ request: { headers } }));
      if (!await verifyPreviewCookie(request.cookies.get(previewCookieName(production))?.value, record.tenantId, record.siteId)) {
        return protect(new NextResponse("Phiên xem trước đã hết hạn — mở lại từ trang quản trị.", { status: 401 }));
      }
      if (pathname === "/api" || pathname.startsWith("/api/")) return protect(NextResponse.next({ request: { headers } }));
      return protect(NextResponse.rewrite(new URL(`/sites/${encodeURIComponent(record.siteId)}${pathname}${search}`, request.url), { request: { headers } }));
    }
    if (!record.isPrimary && record.primaryHost && record.primaryHost !== host) {
      const primary = normalizeHost(record.primaryHost);
      if (!primary || primary !== record.primaryHost) return missing();
      const protocol = production ? "https:" : request.nextUrl.protocol;
      const port = !production && request.nextUrl.port ? `:${request.nextUrl.port}` : "";
      return NextResponse.redirect(new URL(`${protocol}//${primary}${port}${pathname}${search}`), {
        status: 308, headers: { "Cache-Control": "public, max-age=300" },
      });
    }
    headers.set("x-tenant-id", record.tenantId);
    headers.set("x-site-id", record.siteId);
    if (pathname === "/api" || pathname.startsWith("/api/")) return NextResponse.next({ request: { headers } });
    // Keep Next's internal origin so this stays a local rewrite, even for custom Host.
    const destination = new URL(`/sites/${encodeURIComponent(record.siteId)}${pathname}${search}`, request.url);
    return NextResponse.rewrite(destination, { request: { headers } });
  };
}
