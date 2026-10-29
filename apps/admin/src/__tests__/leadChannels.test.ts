import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { effectivePermissions, type Session } from "@solar/auth";
import { openConfig, ChannelError, sendTest } from "@solar/leads";
import { createAction, type ActionContext } from "../lib/action.ts";
import { channelSaveSchema, channelIdSchema, createLeadChannelHandlers, summarizeChannel, telegramInstructions, type ChannelRecord, type LeadChannelDeps } from "../lib/leadChannels.ts";

function setup(allowed = true) {
  const tenantId = randomUUID(), rows = new Map<string, ChannelRecord>(), audits: unknown[] = [], sent: unknown[] = [];
  const session: Session = { id: "session", accountId: randomUUID(), tenantId, realm: "site", audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), expiresAt: new Date(Date.now() + 60000), mustChangePassword: false };
  const ctx: ActionContext = { tenantId, slug: "mau", session };
  const deps: LeadChannelDeps = {
    env: { APP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") },
    can: async () => () => allowed,
    get: async (tenant, id) => { const row = rows.get(id); return row?.tenantId === tenant ? row : null; },
    list: async tenant => [...rows.values()].filter(row => row.tenantId === tenant),
    write: async (tenant, actor, operation, row) => {
      if (operation === "delete") rows.delete(row.id); else rows.set(row.id, row);
      audits.push({ tenant, actor, operation, id: row.id, kind: row.kind, enabled: row.enabled });
      return true;
    },
    validateUrl: async url => { if (url.includes("internal")) throw new ChannelError("URL bị chặn: mạng nội bộ", true); },
    send: async config => { sent.push(config); },
  };
  const handlers = createLeadChannelHandlers(deps), action = createAction(async () => ctx);
  const save = (payload: unknown) => { const form = new FormData(); form.set("payload", JSON.stringify(payload)); return action("settings.manage", channelSaveSchema, handlers.save)({}, form); };
  const run = (operation: "test" | "toggle" | "remove", id: string) => { const form = new FormData(); form.set("id", id); return action("settings.manage", channelIdSchema, handlers[operation])({}, form); };
  return { tenantId, rows, audits, sent, ctx, deps, handlers, save, run };
}
test("lưu mã hóa, webhook secret trả một lần; sửa giữ secret, summary không lộ config", async () => {
  const s = setup();
  const result = await s.save({ kind: "webhook", name: "CRM", config: { url: "https://crm.example/hook?secret=hidden" } });
  assert.equal(result.ok, true); assert.ok(result.secret);
  const row = [...s.rows.values()][0];
  assert.match(row.configEncrypted, /^v1\./); assert.ok(!JSON.stringify(row).includes("crm.example"));
  const summary = summarizeChannel(row, s.deps.env);
  assert.equal(summary.summary, "crm.example"); assert.ok(!JSON.stringify(summary).includes("hidden"));
  const second = await s.save({ id: row.id, kind: "webhook", name: "CRM mới", config: {} });
  assert.equal(second.ok, true); assert.equal(second.secret, undefined);
  const config = openConfig(s.rows.get(row.id)!.configEncrypted, s.deps.env.APP_ENCRYPTION_KEY, { tenantId: s.tenantId, integrationId: row.id });
  assert.equal(config.kind === "webhook" && config.secret, result.secret);
  assert.ok(!JSON.stringify(s.audits).includes(result.secret!));
});
test("webhook/Sheets từ gói Nâng cao: tạo/sửa/gửi thử/bật bị chặn; vẫn xóa hoặc tắt được", async () => {
  const s = setup();
  await s.save({ kind: "webhook", name: "CRM", config: { url: "https://crm.example" } });
  const row = [...s.rows.values()][0];
  s.deps.can = async () => () => false;
  for (const kind of ["webhook", "google_sheets"]) assert.equal((await s.save({ kind, name: "CRM", config: {} })).status, 403);
  assert.equal((await s.run("test", row.id)).status, 403);
  assert.equal((await s.run("toggle", row.id)).ok, true);
  assert.equal((await s.run("toggle", row.id)).status, 403);
  assert.equal((await s.run("remove", row.id)).ok, true);
});
test("tenant A sửa/xóa/gửi thử id B không tìm thấy; permission kiểm trước truy vấn", async () => {
  const s = setup();
  await s.save({ kind: "telegram", name: "Nhóm", config: { chatId: "-1001234" } });
  const row = [...s.rows.values()][0]; row.tenantId = randomUUID();
  for (const operation of ["remove", "toggle", "test"] as const) assert.equal((await s.run(operation, row.id)).status, 404);
  assert.equal((await s.save({ id: row.id, kind: "telegram", name: "Nhóm", config: {} })).status, 404);
  s.ctx.session = { ...s.ctx.session!, permissions: new Set() };
  assert.equal((await s.save({ kind: "telegram", name: "Nhóm", config: { chatId: "-1001234" } })).status, 403);
});
test("gửi thử trả Đã gửi, thiếu env và SSRF báo tiếng Việt không lộ secret", async () => {
  const s = setup();
  await s.save({ kind: "telegram", name: "Nhóm", config: { chatId: "-1001234" } });
  const row = [...s.rows.values()][0];
  assert.equal((await s.run("test", row.id)).message, "Đã gửi");
  s.deps.send = config => sendTest(config, s.deps.env);
  assert.match((await s.run("test", row.id)).error!, /Nền tảng chưa cấu hình Telegram/);
  await s.save({ kind: "email", name: "Email", config: { to: ["a@x.vn"] } });
  const email = [...s.rows.values()].find(item => item.kind === "email")!;
  assert.match((await s.run("test", email.id)).error!, /Nền tảng chưa cấu hình email/);
  assert.match((await s.save({ kind: "webhook", name: "CRM", config: { url: "https://internal.example" } })).error!, /bị chặn/);
});
test("hướng dẫn telegram: /start, lấy chat id và link bot nền tảng", () => {
  const text = telegramInstructions("solar_demo_bot");
  assert.match(text, /\/start/); assert.match(text, /chat id/i); assert.match(text, /https:\/\/t.me\/solar_demo_bot/);
  assert.ok(!telegramInstructions("bad/<script>").includes("t.me/bad"));
});
