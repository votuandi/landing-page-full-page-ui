import { z } from "zod";
import type { Session } from "@solar/auth";
import { toCsv, type LeadActor, type LeadFilters, type LeadPatch, type InboxLead } from "@solar/db";
import { authorize } from "./gate.ts";
import type { ActionContext, ActionResult } from "./action.ts";

export const leadStatuses = { new: "Mới", contacted: "Đã liên hệ", quoted: "Báo giá", won: "Chốt", lost: "Hủy", spam: "Spam" } as const;
const statusSchema = z.enum(["new", "contacted", "quoted", "won", "lost", "spam"]);
const reference = z.union([z.uuid(), z.literal("")]).transform(value => value || null).optional();
export const idSchema = z.object({ id: z.uuid() });
export const resendSchema = idSchema.extend({ jobId: z.uuid() });
export const updateSchema = idSchema.extend({ status: statusSchema.optional(), note: z.string().max(2000).optional(), assigneeId: reference, branchId: reference });

export function parseFilters(params: URLSearchParams): LeadFilters {
  const filters: LeadFilters = {};
  const status = statusSchema.safeParse(params.get("trang-thai"));
  if (status.success) filters.status = status.data;
  const source = params.get("nguon")?.trim(), q = params.get("q")?.trim();
  if (source && /^[\w-]{1,60}$/.test(source)) filters.source = source;
  if (q) filters.q = q.slice(0, 120);
  function day(key: string, next = false) {
    const value = params.get(key);
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return;
    return new Date(date.getTime() - 7 * 3600_000 + (next ? 86400_000 : 0)).toISOString();
  }
  const from = day("tu"), until = day("den", true);
  if (!(from && until && from >= until)) { if (from) filters.from = from; if (until) filters.until = until; }
  return filters;
}
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
export function summarize(value: unknown) {
  const data = object(value), estimate = object(data.estimate);
  const items = Array.isArray(data.items) ? data.items.map(object).filter(item => typeof item.name === "string" && typeof item.qty === "number") : [];
  return {
    province: typeof data.province === "string" ? data.province : "—",
    estimate: Object.entries(estimate).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v)).map(([key, v]) => key === "kWp" ? `${v} kWp` : `${key}: ${v}`).join("; ") || "—",
    items: items.map(item => `${item.qty} × ${item.name}`).join("; ") || "—",
    consentAt: typeof data.consentAt === "string" ? data.consentAt : "—",
  };
}
export function weeklyStats(input: { source: string; createdAt: Date; count?: number }[]) {
  const groups = new Map<string, Map<string, number>>(), weeks = new Set<string>();
  for (const row of input) {
    const local = new Date(row.createdAt.getTime() + 7 * 3600_000);
    local.setUTCDate(local.getUTCDate() - (local.getUTCDay() + 6) % 7);
    const week = local.toISOString().slice(0, 10); weeks.add(week);
    const counts = groups.get(row.source) ?? new Map<string, number>();
    counts.set(week, (counts.get(week) ?? 0) + (row.count ?? 1)); groups.set(row.source, counts);
  }
  const sorted = [...weeks].sort();
  return { weeks: sorted, rows: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([source, counts]) => ({ source, counts: sorted.map(week => counts.get(week) ?? 0), total: [...counts.values()].reduce((a, b) => a + b, 0) })) };
}
type CsvLead = { id: string; source: string; name?: string | null; phone: string; email?: string | null; segment?: string | null; status: string; note?: string | null; assigneeId?: string | null; branchId?: string | null; createdAt: Date; data: unknown };
export function leadCsvRows(rows: CsvLead[]) {
  const safe = (value: string) => /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return toCsv([
    ["ID", "Ngày nhận", "Họ tên", "Số điện thoại", "Email", "Nguồn", "Phân khúc", "Tỉnh/thành", "Dự toán", "Sản phẩm", "Trạng thái", "Ghi chú", "Người phụ trách", "Chi nhánh", "Đồng ý lúc"],
    ...rows.map(row => { const data = summarize(row.data); return [row.id, row.createdAt.toISOString(), row.name ?? "", row.phone, row.email ?? "", row.source, row.segment ?? "", data.province, data.estimate, data.items,
      Object.hasOwn(leadStatuses, row.status) ? leadStatuses[row.status as keyof typeof leadStatuses] : row.status, row.note ?? "", row.assigneeId ?? "", row.branchId ?? "", data.consentAt === "—" ? "" : data.consentAt].map(safe); }),
  ]);
}
export type LeadInboxDeps = {
  can(): Promise<(feature: string) => boolean>;
  list(tenantId: string, filters: LeadFilters, options?: { limit?: number; cursor?: string }): Promise<{ rows: InboxLead[]; cursor: string | null }>;
  latest(tenantId: string): Promise<string | null>;
  update(tenantId: string, id: string, patch: LeadPatch, actor: Session): Promise<boolean>;
  remove(tenantId: string, id: string, actor: Session): Promise<boolean>;
  resend(tenantId: string, leadId: string, jobId: string, actor: Session): Promise<boolean>;
  auditExport(tenantId: string, session: Session, data: { filters: Omit<LeadFilters, "q"> & { search: boolean }; count: number }): Promise<void>;
};
export function leadActor(session: Session, ghostGrantId?: LeadActor["ghostGrantId"]): LeadActor {
  return { type: session.kind === "ghost" ? "platform_admin" : "site_user", id: session.accountId!, ghostGrantId };
}
export function createLeadInboxHandlers(deps: LeadInboxDeps) {
  async function access(context: ActionContext, permission: "leads.view" | "leads.manage") {
    const session = authorize(context.session, context.tenantId, permission), can = await deps.can();
    return { session, can };
  }
  const denied: ActionResult = { ok: false, status: 403, error: "Gói hiện tại không có tính năng này" };
  const missing: ActionResult = { ok: false, status: 404, error: "Không tìm thấy lead hoặc dữ liệu phân công" };
  return {
    async update(input: z.output<typeof updateSchema>, context: ActionContext): Promise<ActionResult> {
      const { session, can } = await access(context, "leads.manage");
      if (!can("leadInbox") || ((input.assigneeId !== undefined || input.branchId !== undefined) && !can("leadAssign"))) return denied;
      const { id, ...patch } = input;
      return await deps.update(context.tenantId, id, patch, session) ? { ok: true, message: "Đã lưu lead" } : missing;
    },
    async remove(input: z.output<typeof idSchema>, context: ActionContext): Promise<ActionResult> {
      const { session, can } = await access(context, "leads.manage"); if (!can("leadInbox")) return denied;
      return await deps.remove(context.tenantId, input.id, session) ? { ok: true, message: "Đã xóa lead" } : missing;
    },
    async resend(input: z.output<typeof resendSchema>, context: ActionContext): Promise<ActionResult> {
      const { session, can } = await access(context, "leads.manage"); if (!can("leadInbox")) return denied;
      return await deps.resend(context.tenantId, input.id, input.jobId, session) ? { ok: true, message: "Đã lên lịch gửi lại" } : missing;
    },
    async latest(_request: Request, context: ActionContext) {
      const { can } = await access(context, "leads.view");
      if (!can("leadInbox")) return Response.json({ error: denied.error }, { status: 403 });
      return Response.json({ latest: await deps.latest(context.tenantId) });
    },
    async export(request: Request, context: ActionContext) {
      const { session, can } = await access(context, "leads.view");
      if (!can("leadInbox") || !can("leadExport")) return Response.json({ error: denied.error }, { status: 403 });
      const filters = parseFilters(new URL(request.url).searchParams), rows: InboxLead[] = [];
      let cursor: string | undefined;
      do {
        const page = await deps.list(context.tenantId, filters, { limit: 100, cursor });
        rows.push(...page.rows); cursor = page.cursor ?? undefined;
      } while (cursor);
      const { q, ...auditFilters } = filters;
      await deps.auditExport(context.tenantId, session, { filters: { ...auditFilters, search: Boolean(q) }, count: rows.length });
      return new Response(leadCsvRows(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="lead.csv"' } });
    },
  };
}
