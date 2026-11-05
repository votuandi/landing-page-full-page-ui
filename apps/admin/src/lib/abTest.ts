import { z } from "zod";
import { parseAbTest, SiteSettingsError, StructureError, type SaveAbTestInput } from "@solar/db";
import type { ActionContext, ActionResult } from "./action.ts";

const copy = (max: number) => z.string().max(max).default("");
export const abTestFormSchema = z.discriminatedUnion("action", [
  z.object({ pageId: z.uuid(), action: z.literal("start"), lead: copy(60), highlight: copy(60), sub: copy(60), subHighlight: copy(60), ctaLabel: copy(80),
    leadEn: copy(60), highlightEn: copy(60), subEn: copy(60), subHighlightEn: copy(60), ctaLabelEn: copy(80) }),
  z.object({ pageId: z.uuid(), action: z.literal("end"), winner: z.enum(["A", "B"]) }),
]);
export function createAbTestHandler(deps: {
  tenant(): Promise<{ tenantId: string; siteId: string }>;
  entitlements(): Promise<(feature: string) => boolean>;
  page(pageId: string): Promise<{ siteId: string; abTest: unknown } | null>;
  save(tenantId: string, input: SaveAbTestInput): Promise<unknown>;
}) {
  return async (input: z.output<typeof abTestFormSchema>, context: ActionContext): Promise<ActionResult> => {
    try {
      const tenant = await deps.tenant();
      if (tenant.tenantId !== context.tenantId) throw new SiteSettingsError("Không tìm thấy website", 404);
      if (!(await deps.entitlements())("abTest")) throw new StructureError("Gói không cho thử nghiệm A/B");
      const page = await deps.page(input.pageId);
      if (!page || page.siteId !== tenant.siteId) throw new SiteSettingsError("Không tìm thấy trang", 404);
      const running = parseAbTest(page.abTest)?.status === "running";
      const localized = (vi: string, en: string) => ({ vi, ...(en ? { en } : {}) });
      await deps.save(tenant.tenantId, input.action === "end" ? input : { pageId: input.pageId, action: "start", title: {
        lead: localized(input.lead, input.leadEn), highlight: localized(input.highlight, input.highlightEn),
        sub: localized(input.sub, input.subEn), subHighlight: localized(input.subHighlight, input.subHighlightEn),
      }, ctaLabel: localized(input.ctaLabel, input.ctaLabelEn) });
      return { ok: true, message: input.action === "end" ? `Đã chọn phiên bản ${input.winner}` : running ? "Đã lưu phiên bản B" : "Đã bắt đầu thử nghiệm A/B" };
    } catch (error) {
      if (error instanceof SiteSettingsError) return { ok: false, status: error.status, error: error.message };
      if (error instanceof StructureError) return { ok: false, status: 400, error: error.message };
      throw error;
    }
  };
}
