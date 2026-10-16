import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_SESSION_MS, previewCookieName, safePreviewPath, signPreviewCookie } from "./preview";

export function createPreviewHandler({ consume, enableDraft, secret = () => process.env.PREVIEW_SECRET, production = process.env.NODE_ENV === "production" }: {
  consume: (tenantId: string, token: string) => Promise<{ siteId: string } | null>;
  enableDraft: () => Promise<void>; secret?: () => string | undefined; production?: boolean;
}) {
  return async (request: NextRequest) => {
    const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer" };
    const unauthorized = () => NextResponse.json({ error: "Liên kết xem trước không hợp lệ hoặc đã hết hạn." }, { status: 401, headers });
    const tenantId = request.headers.get("x-tenant-id"), siteId = request.headers.get("x-site-id");
    const token = request.nextUrl.searchParams.get("token");
    if (request.headers.get("x-preview") !== "1" || !tenantId || !siteId || !token || token.length > 256) return unauthorized();
    // Check configuration before burning a single-use token.
    const cookie = await signPreviewCookie(tenantId, siteId, secret());
    const result = await consume(tenantId, token);
    if (!result || result.siteId !== siteId) return unauthorized();
    await enableDraft();
    // A relative Location keeps the resolved preview host, regardless of forwarded origin headers.
    const response = new NextResponse(null, { status: 307, headers: { ...headers, Location: safePreviewPath(request.nextUrl.searchParams.get("path")) } });
    response.cookies.set(previewCookieName(production), cookie, { httpOnly: true, sameSite: "lax", path: "/", secure: production, maxAge: PREVIEW_SESSION_MS / 1000 });
    return response;
  };
}
