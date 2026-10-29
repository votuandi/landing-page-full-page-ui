import assert from "node:assert/strict";
import test from "node:test";
import { channelConfigSchema, sealConfig, openConfig } from "../config.ts";

test("config: chatId, email, tối đa 5 người nhận và URL Apps Script", () => {
  for (const config of [
    { kind: "telegram", chatId: "foo" }, { kind: "email", to: ["bad"] },
    { kind: "email", to: Array(6).fill("a@x.vn") },
    { kind: "google_sheets", url: "https://example.com/macros/s/a/exec", secret: "abc" },
    { kind: "google_sheets", url: "https://script.google.com/other", secret: "abc" },
    { kind: "webhook", url: "https://example.com", secret: "" },
  ]) assert.equal(channelConfigSchema.safeParse(config).success, false);
  assert.equal(channelConfigSchema.safeParse({ kind: "telegram", chatId: "-1001234" }).success, true);
});
test("config mã hóa, AAD từ chối copy chéo tenant/integration", () => {
  const keys = Buffer.alloc(32, 7).toString("base64"), ctx = { tenantId: "A", integrationId: "1" };
  const config = { kind: "telegram" as const, chatId: "-1001234" };
  const sealed = sealConfig(config, keys, ctx);
  assert.match(sealed, /^v1\./); assert.ok(!sealed.includes(config.chatId));
  assert.deepEqual(openConfig(sealed, keys, ctx), config);
  for (const wrong of [{ ...ctx, tenantId: "B" }, { ...ctx, integrationId: "2" }]) {
    assert.throws(() => openConfig(sealed, keys, wrong), /Bí mật không hợp lệ/);
  }
});
