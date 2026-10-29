import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Session } from "@solar/auth";
import { ChannelError, channelConfigSchema, openConfig, sealConfig, type ChannelConfig, type ChannelKind, type LeadEnv } from "@solar/leads";
import { authorize } from "./gate.ts";
import type { ActionContext, ActionResult } from "./action.ts";

export type ChannelRecord = { id: string; tenantId: string; kind: ChannelKind; name: string; enabled: boolean; configEncrypted: string };
export type LeadChannelDeps = {
  env: LeadEnv;
  can(): Promise<(feature: string) => boolean>;
  get(tenantId: string, id: string): Promise<ChannelRecord | null>;
  list(tenantId: string): Promise<ChannelRecord[]>;
  write(tenantId: string, session: Session, operation: "create" | "update" | "delete", row: ChannelRecord): Promise<boolean>;
  validateUrl(url: string): Promise<void>;
  send(config: ChannelConfig): Promise<void>;
};
export const channelSaveSchema = z.object({ payload: z.string().max(10_000) });
export const channelIdSchema = z.object({ id: z.uuid() });
const saveSchema = z.object({ id: z.uuid().optional(), kind: z.enum(["email", "telegram", "webhook", "google_sheets"]), name: z.string().trim().min(1).max(120), config: z.record(z.string(), z.unknown()) });
export function summarizeChannel(row: ChannelRecord, env: LeadEnv) {
  let summary: string;
  try {
    const config = openConfig(row.configEncrypted, env.APP_ENCRYPTION_KEY, { tenantId: row.tenantId, integrationId: row.id });
    summary = config.kind === "telegram" ? `Chat id …${config.chatId.slice(-4)}` : config.kind === "email" ? `${config.to.length} địa chỉ email` : new URL(config.url).hostname;
  } catch { summary = "Cấu hình kênh không hợp lệ. Vui lòng cập nhật."; }
  return { id: row.id, kind: row.kind, name: row.name, enabled: row.enabled, summary };
}
export type ChannelSummary = ReturnType<typeof summarizeChannel>;
export function telegramInstructions(username?: string) {
  const link = username && /^[A-Za-z0-9_]{5,32}$/.test(username) ? `https://t.me/${username}` : "bot Telegram của nền tảng (liên hệ quản trị để nhận đường dẫn)";
  return `1. Mở ${link}, nhấn Start hoặc gửi /start. 2. Chuyển tiếp một tin nhắn của bạn tới @userinfobot để lấy chat id cá nhân. Với nhóm, thêm bot nền tảng vào nhóm và nhờ quản trị cung cấp chat id nhóm (bắt đầu bằng -100). 3. Nhập chat id và bấm Gửi thử.`;
}
function entitlement(kind: ChannelKind, can: (feature: string) => boolean) {
  if (["webhook", "google_sheets"].includes(kind) && !can("leadWebhook")) throw new ChannelError("Webhook và Google Sheets cần gói Nâng cao trở lên", true);
}
export function createLeadChannelHandlers(deps: LeadChannelDeps) {
  async function run(context: ActionContext, work: (session: Session) => Promise<ActionResult>): Promise<ActionResult> {
    const session = authorize(context.session, context.tenantId, "settings.manage");
    try { return await work(session); }
    catch (error) {
      if (error instanceof ChannelError) return { ok: false, status: /cần gói/.test(error.message) ? 403 : 400, error: error.message };
      if (error instanceof z.ZodError) {
        const labels: Record<string, string> = { name: "Tên kênh", kind: "Loại kênh", url: "URL HTTPS", secret: "Khóa bí mật", chatId: "Chat id", to: "Email nhận thông báo" };
        const fields = [...new Set(error.issues.map(issue => labels[String(issue.path[0])] ?? "Cấu hình kênh"))];
        return { ok: false, status: 400, error: `${fields.join(", ")}: không hợp lệ. Vui lòng kiểm tra lại.` };
      }
      if (error instanceof SyntaxError) return { ok: false, status: 400, error: "Dữ liệu không hợp lệ" };
      throw error;
    }
  }
  async function find(context: ActionContext, id: string) { return deps.get(context.tenantId, id); }
  const missing: ActionResult = { ok: false, status: 404, error: "Không tìm thấy kênh nhận lead" };
  return {
    save: (input: z.output<typeof channelSaveSchema>, context: ActionContext) => run(context, async session => {
      const data = saveSchema.parse(JSON.parse(input.payload));
      const old = data.id ? await find(context, data.id) : null;
      if (data.id && !old) return missing;
      if (old && old.kind !== data.kind) return { ok: false, status: 400, error: "Không thể đổi loại kênh. Hãy tạo kênh mới." };
      entitlement(data.kind, await deps.can());
      const id = old?.id ?? randomUUID(), ctx = { tenantId: context.tenantId, integrationId: id };
      if (!deps.env.APP_ENCRYPTION_KEY) throw new ChannelError("Nền tảng chưa cấu hình APP_ENCRYPTION_KEY");
      let previous: Partial<ChannelConfig> = {};
      if (old) {
        try { previous = openConfig(old.configEncrypted, deps.env.APP_ENCRYPTION_KEY, ctx); }
        catch { /* A malformed legacy config can be replaced with a complete, valid config. */ }
      }
      const secret = data.kind === "webhook" && (!old || !("secret" in previous)) ? randomBytes(32).toString("base64url") : undefined;
      const provided = Object.fromEntries(Object.entries(data.config).filter(([, value]) => value !== "" && value !== undefined));
      const config = channelConfigSchema.parse({ ...previous, ...provided, kind: data.kind,
        ...(data.kind === "webhook" ? { secret: secret ?? ("secret" in previous ? previous.secret : undefined) } : {}),
      });
      if ("url" in config) await deps.validateUrl(config.url);
      const row: ChannelRecord = { id, tenantId: context.tenantId, kind: data.kind, name: data.name, enabled: old?.enabled ?? true, configEncrypted: sealConfig(config, deps.env.APP_ENCRYPTION_KEY, ctx) };
      if (!await deps.write(context.tenantId, session, old ? "update" : "create", row)) return missing;
      return { ok: true, message: "Đã lưu kênh nhận lead", ...(secret ? { secret } : {}) };
    }),
    remove: (input: z.output<typeof channelIdSchema>, context: ActionContext) => run(context, async session => {
      const row = await find(context, input.id); if (!row) return missing;
      return await deps.write(context.tenantId, session, "delete", row) ? { ok: true, message: "Đã xóa kênh" } : missing;
    }),
    toggle: (input: z.output<typeof channelIdSchema>, context: ActionContext) => run(context, async session => {
      const row = await find(context, input.id); if (!row) return missing;
      if (!row.enabled) entitlement(row.kind, await deps.can());
      return await deps.write(context.tenantId, session, "update", { ...row, enabled: !row.enabled }) ? { ok: true, message: row.enabled ? "Đã tắt kênh" : "Đã bật kênh" } : missing;
    }),
    test: (input: z.output<typeof channelIdSchema>, context: ActionContext) => run(context, async () => {
      const row = await find(context, input.id); if (!row) return missing;
      entitlement(row.kind, await deps.can());
      if (!deps.env.APP_ENCRYPTION_KEY) throw new ChannelError("Nền tảng chưa cấu hình APP_ENCRYPTION_KEY");
      const config = openConfig(row.configEncrypted, deps.env.APP_ENCRYPTION_KEY, { tenantId: context.tenantId, integrationId: row.id });
      if (config.kind !== row.kind) throw new ChannelError("Cấu hình kênh không hợp lệ", true);
      await deps.send(config);
      return { ok: true, message: "Đã gửi" };
    }),
  };
}
