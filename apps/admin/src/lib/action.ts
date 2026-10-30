import type { z } from "zod";
import { ForbiddenError, MustChangePasswordError, UnauthenticatedError, type Session } from "@solar/auth";
import { authorize, type Access } from "./gate.ts";
import { AccountInputError } from "./accounts.ts";
import type { ProductCsvPreview } from "@solar/db";

export type ActionResult = { ok?: boolean; error?: string; status?: number; message?: string; secret?: string; uri?: string; codes?: string[]; updatedAt?: string; url?: string; limit?: boolean; clientId?: string; csvRows?: ProductCsvPreview["rows"] };
export type ActionContext = { tenantId: string; slug: string; session: Session | null };
export type AdminAction = (previous: ActionResult, form: FormData) => Promise<ActionResult>;
type Loader = () => Promise<ActionContext>;
function failure(error: unknown): ActionResult | null {
  if (error instanceof ForbiddenError || error instanceof MustChangePasswordError || error instanceof UnauthenticatedError || error instanceof AccountInputError) {
    return { ok: false, status: error.status, error: error.message, ...(error instanceof AccountInputError ? error.details : {}) };
  }
  // Let Next handle redirect/notFound/forbidden control flow without relying on private internals.
  if (error instanceof Error && "digest" in error) return null;
  return { ok: false, status: 500, error: "Không thể thực hiện lúc này. Vui lòng thử lại." };
}
export function createAction(load: Loader) {
  return function action<S extends z.ZodType>(permission: Access | "public", schema: S, handler: (input: z.output<S>, context: ActionContext) => Promise<ActionResult>) {
    const run: AdminAction = async (_previous, form) => {
      try {
        if (!(form instanceof FormData)) return { ok: false, status: 400, error: "Dữ liệu không hợp lệ" };
        const parsed = schema.safeParse(Object.fromEntries(form.entries()));
        if (!parsed.success) return { ok: false, status: 400, error: "Vui lòng kiểm tra các trường đã nhập" };
        const context = await load();
        if (permission === "public" && context.session?.mustChangePassword) throw new MustChangePasswordError();
        if (permission !== "public") authorize(context.session, context.tenantId, permission);
        return await handler(parsed.data, context);
      } catch (error) {
        const result = failure(error);
        if (!result) throw error;
        return result;
      }
    };
    return Object.assign(run, { permission });
  };
}
async function loadContext(): Promise<ActionContext> {
  const { getTenant, getAdminSession } = await import("./auth.ts");
  const tenant = await getTenant();
  return { tenantId: tenant.tenantId, slug: tenant.slug, session: await getAdminSession() };
}
export const action = createAction(loadContext);
function sameHost(request: Request) {
  const origin = request.headers.get("origin"), host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
export function createRoute(load: Loader) {
  return function route(permission: Access, handler: (request: Request, context: ActionContext) => Promise<Response>) {
    const run = async (request: Request) => {
      let response: Response;
      try {
        const context = await load();
        authorize(context.session, context.tenantId, permission);
        // Read routes need no CSRF token. Mutations must come from the tenant host: compare with Host (the one
        // getTenant() resolved), not request.url — `next start` builds that from its own hostname.
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !sameHost(request)) throw new ForbiddenError();
        response = await handler(request, context);
      } catch (error) {
        const result = failure(error);
        if (!result) throw error;
        response = Response.json({ error: result.error }, { status: result.status });
      }
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("X-Robots-Tag", "noindex");
      return response;
    };
    return Object.assign(run, { permission });
  };
}
export const route = createRoute(loadContext);
