import { z } from "zod";
import { isPageType } from "@solar/presets";
import { StructureError, SiteSettingsError } from "@solar/db";
import type { ActionContext, ActionResult } from "./action.ts";

export const pageTypeSchema = z.object({ siteId: z.uuid(), type: z.string().refine(isPageType), enabled: z.enum(["true", "false"]),
  expected: z.string().max(2000).transform((value, ctx) => {
    try { return z.array(z.string().refine(isPageType)).max(20).parse(JSON.parse(value)); }
    catch { ctx.addIssue({ code: "custom", message: "Danh mục không hợp lệ" }); return z.NEVER; }
  }) });
export function createPageTypeHandler(deps: {
  tenant(): Promise<{ tenantId: string; siteId: string }>;
  set(tenantId: string, input: { siteId: string; pageTypes: string[]; expected: string[] }): Promise<unknown>;
}) {
  return async (input: z.output<typeof pageTypeSchema>, context: ActionContext): Promise<ActionResult> => {
    const tenant = await deps.tenant();
    if (tenant.tenantId !== context.tenantId || tenant.siteId !== input.siteId) return { ok: false, status: 404, error: "Không tìm thấy website" };
    const pageTypes = input.enabled === "true" ? [...new Set([...input.expected, input.type])] : input.expected.filter(type => type !== input.type);
    try {
      await deps.set(context.tenantId, { siteId: tenant.siteId, pageTypes, expected: input.expected });
      return { ok: true, message: "Đã áp dụng danh mục trang" };
    } catch (error) {
      if (error instanceof StructureError) return { ok: false, status: 400, error: error.message };
      if (error instanceof SiteSettingsError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  };
}
