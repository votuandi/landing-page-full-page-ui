import assert from "node:assert/strict";
import test from "node:test";
import type { EntitlementSubject } from "@solar/plans";
import { eligibleLeadSender } from "../senderDomain.ts";

const tenant: EntitlementSubject & { name: string } = { name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active", createdAt: new Date("2026-01-01"), addons: [] };
const row = { hostname: "mail.congty.vn", status: "verified", tenant };

test("chỉ verified và entitlement lúc gửi mới có sender; dữ liệu cũ không có hàng", () => {
  assert.equal(eligibleLeadSender(null, []), null);
  for (const status of ["pending", "not_started", "failed", "temporary_failure", "unknown"]) assert.equal(eligibleLeadSender({ ...row, status }, []), null);
  assert.deepEqual(eligibleLeadSender(row, []), { hostname: row.hostname, name: tenant.name });
});

test("hạ/nâng gói không sửa xác minh; suspended, hết trial, override và kill switch không có sender", () => {
  for (const changed of [{ planId: "basic" }, { planId: "pro" }, { status: "suspended" }, { status: "trial" },
    { featureOverrides: { senderDomain: { on: false, reason: "Tạm tắt" } } }]) {
    assert.equal(eligibleLeadSender({ ...row, tenant: { ...tenant, ...changed } }, []), null);
  }
  assert.equal(eligibleLeadSender(row, ["senderDomain"]), null);
  assert.equal(eligibleLeadSender(row, [])?.hostname, row.hostname);
  assert.equal(row.status, "verified");
});
