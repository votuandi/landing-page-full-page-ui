import { cache } from "react";
import { cookies, headers } from "next/headers";
import { forbidden, notFound, redirect } from "next/navigation";
import { UnauthenticatedError, MustChangePasswordError } from "@solar/auth";
import { getRuntime } from "./runtime.ts";
import { authorize, type Access } from "./gate.ts";
import { requestHost } from "./hostContext.ts";

export const getTenant = cache(async () => {
  // Resolve Host again at the trust boundary; never trust a caller-supplied x-tenant-id.
  const runtime = getRuntime();
  const tenant = await runtime.resolveHost(requestHost(await headers(), runtime.platform, runtime.secret));
  if (!tenant || !["active", "trial"].includes(tenant.tenantStatus)) throw new UnauthenticatedError();
  return tenant;
});
export const getAdminSession = cache(async () => {
  const tenant = await getTenant(), { realm } = getRuntime();
  return realm.getSession((await cookies()).get(realm.cookieOptions().name)?.value, { tenantOfHost: tenant.tenantId });
});
export async function requirePermission(permission: Access) {
  return authorize(await getAdminSession(), (await getTenant()).tenantId, permission);
}
export async function requirePagePermission(permission: Access) {
  try { return await requirePermission(permission); }
  catch (error) {
    if (error instanceof MustChangePasswordError) redirect("/doi-mat-khau");
    if (error instanceof UnauthenticatedError) redirect("/dang-nhap");
    if (error instanceof Error && "status" in error && error.status === 403) forbidden();
    notFound();
  }
}
export async function setSessionCookie(cookie: ReturnType<ReturnType<typeof getRuntime>["realm"]["cookieOptions"]> & { value: string }) {
  (await cookies()).set(cookie.name, cookie.value, cookie);
}
export async function requestInfo() {
  const h = await headers();
  // Caddy must overwrite these headers; never expose the app port directly in production.
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown", userAgent: (h.get("user-agent") ?? "").slice(0, 512) };
}
