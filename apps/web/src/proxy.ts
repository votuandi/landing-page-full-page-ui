import type { NextRequest } from "next/server";
import { createProxy } from "./lib/tenant/proxy";

export async function proxy(request: NextRequest) {
  const enabled = process.env.MULTI_TENANT === "1";
  // Leave Prisma and Redis uninitialized in single-site mode.
  const resolver = { resolve: async (host: string) => {
    const { getHostResolver } = await import("./lib/tenant");
    return getHostResolver().resolve(host);
  } };
  return createProxy(resolver, { enabled })(request);
}

export const config = {
  matcher: ["/((?!api/health/?$|_next/static(?:/|$)|_next/image(?:/|$)|(?:fonts|images|videos|preset-media|backup)(?:/|$)|favicon\\.[^/]+$|logo\\.svg$|site\\.webmanifest$).*)"],
};
