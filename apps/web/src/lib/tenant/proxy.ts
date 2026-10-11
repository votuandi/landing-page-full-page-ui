import { NextRequest, NextResponse } from "next/server";
import { normalizeHost } from "./host";
import type { HostLookup } from "./resolver";

export function createProxy(resolver: { resolve: HostLookup }, { enabled, production = process.env.NODE_ENV === "production" }: { enabled: boolean; production?: boolean }) {
  return async function route(request: NextRequest) {
    const headers = new Headers(request.headers);
    headers.delete("x-tenant-id");
    headers.delete("x-site-id");
    const { pathname, search } = request.nextUrl;
    const missing = () => new NextResponse("Không tìm thấy website.", { status: 404, headers: { "Cache-Control": "no-store" } });
    // Next decodes paths during routing: block encoded internal paths as well.
    let decoded: string;
    try { decoded = decodeURIComponent(pathname); } catch { return missing(); }
    if (decoded === "/sites" || decoded.startsWith("/sites/")) return missing();
    if (!enabled) return NextResponse.next({ request: { headers } });
    const host = normalizeHost(headers.get("host"));
    if (!host) return missing();
    const record = await resolver.resolve(host);
    if (!record || !["verified", "active"].includes(record.status)) return missing();
    if (record.tenantStatus === "suspended") return new NextResponse("Website tạm ngừng hoạt động.", {
      status: 403, headers: { "Cache-Control": "no-store" },
    });
    if (!record.isPrimary && record.primaryHost && record.primaryHost !== host) {
      const primary = normalizeHost(record.primaryHost);
      if (!primary || primary !== record.primaryHost) return missing();
      const protocol = production ? "https:" : request.nextUrl.protocol;
      return NextResponse.redirect(new URL(`${protocol}//${primary}${pathname}${search}`), 308);
    }
    headers.set("x-tenant-id", record.tenantId);
    headers.set("x-site-id", record.siteId);
    if (pathname === "/api" || pathname.startsWith("/api/")) return NextResponse.next({ request: { headers } });
    // Keep Next's internal origin so this stays a local rewrite, even for custom Host.
    const destination = new URL(`/sites/${encodeURIComponent(record.siteId)}${pathname}${search}`, request.url);
    return NextResponse.rewrite(destination, { request: { headers } });
  };
}
