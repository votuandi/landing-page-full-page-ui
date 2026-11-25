import { NextResponse, type NextRequest } from "next/server";
import { getRuntime } from "./lib/runtime.ts";
import { hostContext, requestHost } from "./lib/hostContext.ts";
import { adminCsp } from "./lib/csp.ts";
import { previewOrigin } from "./lib/previewUrl.ts";

export async function proxy(request: NextRequest) {
  const h = new Headers(request.headers);
  const runtime = getRuntime(), host = requestHost(request.headers, runtime.platform, runtime.secret);
  for (const name of [...h.keys()]) if (name.startsWith("x-tenant-") || name === "x-site-id" || name.startsWith("x-admin-")) h.delete(name);
  const tenant = await runtime.resolveHost(host);
  const production = process.env.NODE_ENV === "production";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = adminCsp({ nonce, production, previewOrigin: tenant ? previewOrigin({
    slug: tenant.slug, platform: runtime.platform, production, port: process.env.TENANT_PUBLIC_PORT,
  }) : undefined });
  // Next reads the request CSP to apply this nonce to its own scripts.
  h.set("Content-Security-Policy", csp);
  h.set("x-nonce", nonce);
  let response: NextResponse;
  if (!tenant || !["active", "trial"].includes(tenant.tenantStatus)) {
    const paused = !!tenant;
    const url = request.nextUrl.clone();
    url.pathname = paused ? "/loi/tam-ngung" : "/loi/khong-tim-thay";
    url.search = "";
    response = NextResponse.rewrite(url, { status: paused ? 403 : 404, request: { headers: h } });
  } else {
    h.set("host", host);
    h.set("x-forwarded-host", host);
    h.set("x-admin-host-context", hostContext(host, runtime.secret));
    h.set("x-tenant-id", tenant.tenantId);
    h.set("x-tenant-slug", tenant.slug);
    h.set("x-admin-path", request.nextUrl.pathname);
    response = NextResponse.next({ request: { headers: h } });
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
// getTenant() resolves and verifies Host again in route(); bypass proxy's 10 MB body cloning.
// Next 16.3.8: dist/server/config-shared.d.ts, experimental.proxyClientMaxBodySize.
export const config = { matcher: ["/((?!api/health/?$|_next/static|_next/image|fonts/|favicon.ico|api/media/[^/]+/upload/?$).*)"] };
