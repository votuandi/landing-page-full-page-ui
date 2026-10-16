import { openChallenge, sealChallenge } from "./challenge.ts";
import { adminSlug } from "./host.ts";

// Next's Server Action redirect fetch drops Host and calls its loopback origin.
// Preserve the already-validated host with authenticated context, never raw forwarded headers.
export function hostContext(host: string, secret: string, now = Date.now()) {
  return sealChallenge({ host }, "admin", "routing", secret, now);
}
export function requestHost(headers: Headers, platform: string, secret: string, now = Date.now()) {
  const host = headers.get("host") ?? "";
  if (adminSlug(host, platform)) return host;
  const context = openChallenge(headers.get("x-admin-host-context") ?? undefined, "admin", "routing", secret, now);
  return context?.host && adminSlug(context.host, platform) ? context.host : host;
}
