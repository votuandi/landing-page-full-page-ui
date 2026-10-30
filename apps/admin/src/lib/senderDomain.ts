import { z } from "zod";
import type { Session } from "@solar/auth";
import { ChannelError, normalizeSenderHostname, mapResendStatus, type SenderDomainEnv, type ResendDomain, type SenderDnsRecord } from "@solar/leads";
import { authorize } from "./gate.ts";
import type { ActionContext, ActionResult } from "./action.ts";

export type SendingDomainRow = { id: string; tenantId: string; hostname: string; status: "pending" | "verified" | "failed"; providerId: string | null; records: unknown; verifiedAt: Date | null };
type DomainPatch = { providerId?: string; records: SenderDnsRecord[]; status?: SendingDomainRow["status"]; verifiedAt?: Date | null };
export type SenderDomainDeps = {
  env: SenderDomainEnv; reserved: readonly string[];
  can(): Promise<(feature: string) => boolean>;
  get(tenantId: string): Promise<SendingDomainRow | null>;
  reserve(tenantId: string, session: Session, hostname: string): Promise<SendingDomainRow>;
  update(tenantId: string, session: Session, before: SendingDomainRow, patch: DomainPatch, action: "add" | "check"): Promise<boolean>;
  remove(tenantId: string, session: Session, before: SendingDomainRow): Promise<boolean>;
  provider: {
    create(hostname: string): Promise<ResendDomain>; get(id: string): Promise<ResendDomain>;
    verify(id: string): Promise<void>; remove(id: string): Promise<void>;
  };
};
export const senderHostnameSchema = z.object({ hostname: z.string().trim().min(1).max(1024) });
export const senderEmptySchema = z.object({});
const missing: ActionResult = { ok: false, status: 404, error: "Chưa có tên miền gửi email." };
export function createSenderDomainHandlers(deps: SenderDomainDeps) {
  function configured() {
    if (!deps.env.RESEND_DOMAINS_API_KEY) throw new ChannelError("Nền tảng chưa cấu hình khóa quản lý tên miền gửi email.");
  }
  async function run(context: ActionContext, work: (session: Session) => Promise<ActionResult>): Promise<ActionResult> {
    const session = authorize(context.session, context.tenantId, "email.manage");
    if (!(await deps.can())("senderDomain")) return { ok: false, status: 403, error: "Gửi email từ tên miền riêng cần gói Cao cấp." };
    try { return await work(session); }
    catch (error) {
      if (error instanceof ChannelError) return { ok: false, status: 400, error: error.message };
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { ok: false, status: 400, error: "Tên miền này chưa dùng được. Vui lòng liên hệ hỗ trợ." };
      }
      return { ok: false, status: 400, error: "Không thể thực hiện với tên miền gửi. Vui lòng thử lại." };
    }
  }
  return {
    add: (input: z.output<typeof senderHostnameSchema>, context: ActionContext) => run(context, async session => {
      const hostname = normalizeSenderHostname(input.hostname, deps.reserved);
      configured();
      const row = await deps.reserve(context.tenantId, session, hostname);
      let domain: ResendDomain;
      try { domain = await deps.provider.create(hostname); }
      catch (error) { await deps.remove(context.tenantId, session, row); throw error; }
      // A concurrent removal may have released this reservation while the provider was responding.
      if (!await deps.update(context.tenantId, session, row, { providerId: domain.id, records: domain.records }, "add")) {
        await deps.provider.remove(domain.id);
        return missing;
      }
      return { ok: true, message: "Đã thêm tên miền. Hãy thêm các bản ghi DNS rồi bấm Kiểm tra." };
    }),
    check: (_input: z.output<typeof senderEmptySchema>, context: ActionContext) => run(context, async session => {
      const row = await deps.get(context.tenantId); if (!row) return missing;
      if (!row.providerId) return { ok: false, status: 400, error: "Tên miền chưa khởi tạo xong. Vui lòng xóa rồi thêm lại." };
      configured(); await deps.provider.verify(row.providerId);
      const domain = await deps.provider.get(row.providerId);
      if (domain.id !== row.providerId || normalizeSenderHostname(domain.name, []) !== row.hostname) throw new ChannelError("Phản hồi dịch vụ tên miền gửi không hợp lệ.");
      const status = mapResendStatus(domain.status);
      if (!await deps.update(context.tenantId, session, row, { status, records: domain.records, verifiedAt: status === "verified" ? new Date() : null }, "check")) return missing;
      return { ok: true, message: status === "verified" ? "Tên miền đã xác minh. Thông báo lead sẽ gửi từ tên miền này."
        : status === "failed" ? "Xác minh thất bại. Vui lòng kiểm tra lại DNS." : "Đang chờ DNS. Vui lòng đợi rồi kiểm tra lại." };
    }),
    remove: (_input: z.output<typeof senderEmptySchema>, context: ActionContext) => run(context, async session => {
      const row = await deps.get(context.tenantId); if (!row) return missing;
      if (row.providerId) { configured(); await deps.provider.remove(row.providerId); }
      if (!await deps.remove(context.tenantId, session, row)) return missing;
      return { ok: true, message: "Đã xóa tên miền gửi. Thông báo lead sẽ dùng tên miền nền tảng." };
    }),
  };
}
